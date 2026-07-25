package com.masaakis.catalog.application;

import com.masaakis.security.AppException;
import com.masaakis.security.StaffPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.UUID;

@Service
public class AdminCatalogService {
    private final JdbcClient jdbc;

    public AdminCatalogService(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Transactional(readOnly = true)
    public AdminCatalogResponse get(StaffPrincipal principal) {
        UUID menuId = menuId(principal);
        var menu = jdbc.sql("""
                select id, slug, name, description, logo_url, locale, published
                from menu where id = :id and tenant_id = :tenantId
                """)
                .param("id", menuId).param("tenantId", principal.tenantId())
                .query((rs, n) -> new AdminCatalogResponse.MenuView(
                        rs.getObject("id", UUID.class), rs.getString("slug"),
                        rs.getString("name"), rs.getString("description"),
                        rs.getString("logo_url"), rs.getString("locale"),
                        rs.getBoolean("published")))
                .single();

        var categories = new LinkedHashMap<UUID, MutableCategory>();
        jdbc.sql("""
                select id, name, sort_order, active from menu_category
                where tenant_id = :tenantId and menu_id = :menuId and archived = false
                order by sort_order, created_at
                """)
                .param("tenantId", principal.tenantId()).param("menuId", menuId)
                .query((rs, n) -> new MutableCategory(
                        rs.getObject("id", UUID.class), rs.getString("name"),
                        rs.getInt("sort_order"), rs.getBoolean("active")))
                .list().forEach(category -> categories.put(category.id, category));

        jdbc.sql("""
                select p.id, p.category_id, p.sku, p.name, p.description, p.allergen_info,
                       p.image_url, p.price, p.currency, p.sort_order, p.active, p.available, p.version
                from product p join menu_category c on c.id = p.category_id and c.tenant_id = p.tenant_id
                where p.tenant_id = :tenantId and c.menu_id = :menuId and p.archived = false
                order by p.sort_order, p.created_at
                """)
                .param("tenantId", principal.tenantId()).param("menuId", menuId)
                .query((rs, n) -> new AdminCatalogResponse.ProductView(
                        rs.getObject("id", UUID.class), rs.getObject("category_id", UUID.class),
                        rs.getString("sku"), rs.getString("name"), rs.getString("description"),
                        rs.getString("allergen_info"), rs.getString("image_url"),
                        rs.getBigDecimal("price"), rs.getString("currency"),
                        rs.getInt("sort_order"), rs.getBoolean("active"),
                        rs.getBoolean("available"), rs.getLong("version")))
                .list().forEach(product -> {
                    var category = categories.get(product.categoryId());
                    if (category != null) category.products.add(product);
                });

        return new AdminCatalogResponse(menu, categories.values().stream().map(MutableCategory::view).toList());
    }

    @Transactional
    public UUID createCategory(StaffPrincipal principal, String name, int sortOrder) {
        principal.require("catalog/write");
        UUID id = UUID.randomUUID();
        jdbc.sql("""
                insert into menu_category (id, tenant_id, menu_id, name, sort_order)
                values (:id, :tenantId, :menuId, :name, :sortOrder)
                """)
                .param("id", id).param("tenantId", principal.tenantId())
                .param("menuId", menuId(principal)).param("name", name.trim())
                .param("sortOrder", sortOrder).update();
        audit(principal, "CATEGORY_CREATED", "menu_category", id);
        return id;
    }

    @Transactional
    public void updateCategory(StaffPrincipal principal, UUID id, String name, int sortOrder, boolean active) {
        principal.require("catalog/write");
        int changed = jdbc.sql("""
                update menu_category set name=:name, sort_order=:sortOrder, active=:active, updated_at=now()
                where id=:id and tenant_id=:tenantId and archived=false
                """)
                .param("name", name.trim()).param("sortOrder", sortOrder).param("active", active)
                .param("id", id).param("tenantId", principal.tenantId()).update();
        requireChanged(changed);
        audit(principal, "CATEGORY_UPDATED", "menu_category", id);
    }

    @Transactional
    public void archiveCategory(StaffPrincipal principal, UUID id) {
        principal.require("catalog/write");
        int changed = jdbc.sql("""
                update menu_category set archived=true, active=false, updated_at=now()
                where id=:id and tenant_id=:tenantId and archived=false
                """).param("id", id).param("tenantId", principal.tenantId()).update();
        requireChanged(changed);
        jdbc.sql("update product set archived=true, active=false, updated_at=now() where category_id=:id and tenant_id=:tenantId")
                .param("id", id).param("tenantId", principal.tenantId()).update();
        audit(principal, "CATEGORY_ARCHIVED", "menu_category", id);
    }

    @Transactional
    public UUID createProduct(
            StaffPrincipal principal, UUID categoryId, String sku, String name, String description,
            String allergenInfo, String imageUrl, BigDecimal price, String currency, int sortOrder) {
        principal.require("catalog/write");
        ensureCategory(principal, categoryId);
        UUID id = UUID.randomUUID();
        jdbc.sql("""
                insert into product (id, tenant_id, category_id, sku, name, description, allergen_info,
                                     image_url, price, currency, sort_order)
                values (:id, :tenantId, :categoryId, :sku, :name, :description, :allergenInfo,
                        :imageUrl, :price, :currency, :sortOrder)
                """)
                .param("id", id).param("tenantId", principal.tenantId()).param("categoryId", categoryId)
                .param("sku", blankToNull(sku)).param("name", name.trim())
                .param("description", blankToNull(description)).param("allergenInfo", blankToNull(allergenInfo))
                .param("imageUrl", blankToNull(imageUrl)).param("price", price)
                .param("currency", currency.toUpperCase()).param("sortOrder", sortOrder).update();
        audit(principal, "PRODUCT_CREATED", "product", id);
        return id;
    }

    @Transactional
    public void updateProduct(
            StaffPrincipal principal, UUID id, UUID categoryId, String sku, String name,
            String description, String allergenInfo, String imageUrl, int sortOrder, boolean active) {
        principal.require("catalog/write");
        ensureCategory(principal, categoryId);
        int changed = jdbc.sql("""
                update product set category_id=:categoryId, sku=:sku, name=:name, description=:description,
                    allergen_info=:allergenInfo, image_url=:imageUrl, sort_order=:sortOrder, active=:active,
                    version=version+1, updated_at=now()
                where id=:id and tenant_id=:tenantId and archived=false
                """)
                .param("categoryId", categoryId).param("sku", blankToNull(sku)).param("name", name.trim())
                .param("description", blankToNull(description)).param("allergenInfo", blankToNull(allergenInfo))
                .param("imageUrl", blankToNull(imageUrl)).param("sortOrder", sortOrder).param("active", active)
                .param("id", id).param("tenantId", principal.tenantId()).update();
        requireChanged(changed);
        audit(principal, "PRODUCT_UPDATED", "product", id);
    }

    @Transactional
    public void changePrice(StaffPrincipal principal, UUID id, BigDecimal price, String currency, long version) {
        principal.require("price/write");
        int changed = jdbc.sql("""
                update product set price=:price, currency=:currency, version=version+1, updated_at=now()
                where id=:id and tenant_id=:tenantId and archived=false and version=:version
                """).param("price", price).param("currency", currency.toUpperCase())
                .param("id", id).param("tenantId", principal.tenantId()).param("version", version).update();
        if (changed == 0) throw new AppException(HttpStatus.CONFLICT, "PRICE_VERSION_CONFLICT",
                "Ürün başka bir kullanıcı tarafından değiştirildi; listeyi yenileyin.");
        audit(principal, "PRODUCT_PRICE_CHANGED", "product", id);
    }

    @Transactional
    public void setAvailability(StaffPrincipal principal, UUID id, boolean available) {
        principal.require("catalog/write");
        int changed = jdbc.sql("""
                update product set available=:available, version=version+1, updated_at=now()
                where id=:id and tenant_id=:tenantId and archived=false
                """).param("available", available).param("id", id)
                .param("tenantId", principal.tenantId()).update();
        requireChanged(changed);
        audit(principal, "PRODUCT_AVAILABILITY_CHANGED", "product", id);
    }

    @Transactional
    public void archiveProduct(StaffPrincipal principal, UUID id) {
        principal.require("catalog/write");
        int changed = jdbc.sql("""
                update product set archived=true, active=false, version=version+1, updated_at=now()
                where id=:id and tenant_id=:tenantId and archived=false
                """).param("id", id).param("tenantId", principal.tenantId()).update();
        requireChanged(changed);
        audit(principal, "PRODUCT_ARCHIVED", "product", id);
    }

    @Transactional
    public void updateMenu(StaffPrincipal principal, String name, String description, String logoUrl, String locale) {
        principal.require("catalog/write");
        jdbc.sql("""
                update menu set name=:name, description=:description, logo_url=:logoUrl, locale=:locale, updated_at=now()
                where id=:id and tenant_id=:tenantId
                """).param("name", name.trim()).param("description", blankToNull(description))
                .param("logoUrl", blankToNull(logoUrl)).param("locale", locale.toLowerCase())
                .param("id", menuId(principal)).param("tenantId", principal.tenantId()).update();
        audit(principal, "MENU_UPDATED", "menu", menuId(principal));
    }

    @Transactional
    public void publish(StaffPrincipal principal, boolean published) {
        principal.require("catalog/write");
        UUID menuId = menuId(principal);
        if (published) {
            long count = jdbc.sql("""
                    select count(*) from product p join menu_category c on c.id=p.category_id and c.tenant_id=p.tenant_id
                    where p.tenant_id=:tenantId and c.menu_id=:menuId and c.active=true and c.archived=false
                      and p.active=true and p.archived=false
                    """).param("tenantId", principal.tenantId()).param("menuId", menuId)
                    .query(Long.class).single();
            if (count == 0) throw new AppException(HttpStatus.CONFLICT, "EMPTY_MENU",
                    "Yayınlamak için en az bir aktif ürün gerekir.");
        }
        jdbc.sql("""
                update menu set published=:published, published_at=case when :published then now() else null end, updated_at=now()
                where id=:id and tenant_id=:tenantId
                """).param("published", published).param("id", menuId)
                .param("tenantId", principal.tenantId()).update();
        audit(principal, published ? "MENU_PUBLISHED" : "MENU_UNPUBLISHED", "menu", menuId);
    }

    @Transactional(readOnly = true)
    public String slug(StaffPrincipal principal) {
        return jdbc.sql("select slug from menu where id=:id and tenant_id=:tenantId")
                .param("id", menuId(principal)).param("tenantId", principal.tenantId())
                .query(String.class).single();
    }

    private UUID menuId(StaffPrincipal principal) {
        return jdbc.sql("""
                select id from menu where tenant_id=:tenantId and branch_id=:branchId order by created_at limit 1
                """).param("tenantId", principal.tenantId()).param("branchId", principal.branchId())
                .query(UUID.class).optional()
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "MENU_NOT_FOUND", "Şube menüsü bulunamadı."));
    }

    private void ensureCategory(StaffPrincipal principal, UUID id) {
        long count = jdbc.sql("select count(*) from menu_category where id=:id and tenant_id=:tenantId and archived=false")
                .param("id", id).param("tenantId", principal.tenantId()).query(Long.class).single();
        if (count == 0) requireChanged(0);
    }

    private void audit(StaffPrincipal principal, String action, String type, UUID id) {
        jdbc.sql("""
                insert into audit_log (id, tenant_id, actor_user_id, action, object_type, object_id)
                values (:id, :tenantId, :userId, :action, :type, :objectId)
                """).param("id", UUID.randomUUID()).param("tenantId", principal.tenantId())
                .param("userId", principal.userId()).param("action", action)
                .param("type", type).param("objectId", id).update();
    }

    private static void requireChanged(int changed) {
        if (changed == 0) throw new AppException(HttpStatus.NOT_FOUND, "CATALOG_ITEM_NOT_FOUND",
                "Katalog kaydı bulunamadı.");
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static final class MutableCategory {
        private final UUID id;
        private final String name;
        private final int sortOrder;
        private final boolean active;
        private final ArrayList<AdminCatalogResponse.ProductView> products = new ArrayList<>();

        private MutableCategory(UUID id, String name, int sortOrder, boolean active) {
            this.id = id; this.name = name; this.sortOrder = sortOrder; this.active = active;
        }

        private AdminCatalogResponse.CategoryView view() {
            return new AdminCatalogResponse.CategoryView(id, name, sortOrder, active, products);
        }
    }
}
