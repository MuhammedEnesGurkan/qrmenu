package com.masaakis.menu.application;

import com.masaakis.menu.domain.Menu;
import com.masaakis.menu.infrastructure.MenuCategory;
import com.masaakis.menu.infrastructure.MenuProduct;
import com.masaakis.menu.infrastructure.MenuRepository;
import org.springframework.stereotype.Service;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class PublicMenuService {
    private final MenuRepository menuRepository;
    private final JdbcClient jdbc;

    public PublicMenuService(MenuRepository menuRepository,JdbcClient jdbc) {
        this.menuRepository = menuRepository;
        this.jdbc=jdbc;
    }

    @Transactional(readOnly = true)
    public PublicMenuResponse getPublishedMenu(String slug) {
        return getPublishedMenu(slug,null);
    }

    @Transactional(readOnly = true)
    public PublicMenuResponse getPublishedMenu(String slug,String requestedLocale) {
        Menu menu = menuRepository.findPublishedBySlug(slug)
                .orElseThrow(MenuNotFoundException::new);
        String locale=requestedLocale==null?menu.getLocale():requestedLocale;
        List<String>locales=jdbc.sql("select locale from menu_translation where menu_id=:id union select :base order by 1")
                .param("id",menuId(slug,menu.getTenantId())).param("base",menu.getLocale()).query(String.class).list();
        if(!locales.contains(locale))locale=menu.getLocale();
        final String selected=locale;UUID mid=menuId(slug,menu.getTenantId());
        var menuText=jdbc.sql("select name,description from menu_translation where menu_id=:id and tenant_id=:t and locale=:l")
                .param("id",mid).param("t",menu.getTenantId()).param("l",selected).query((rs,n)->new Text(rs.getString(1),rs.getString(2),null)).optional();

        List<PublicMenuResponse.CategoryResponse> categories = menu.getCategories().stream()
                .filter(MenuCategory::isActive)
                .map(category -> new PublicMenuResponse.CategoryResponse(
                        categoryName(category,selected),
                        category.getProducts().stream()
                                .filter(PublicMenuService::isPublic)
                                .map(product->toResponse(product,selected))
                                .toList()))
                .filter(category -> !category.products().isEmpty())
                .toList();

        return new PublicMenuResponse(
                menu.getSlug(),
                menuText.map(Text::name).orElse(menu.getName()),
                menuText.map(Text::description).orElse(menu.getDescription()),
                menu.getLogoUrl(),
                selected,
                categories,locales,new PublicMenuResponse.Branding(menu.getBrandPrimaryColor(),menu.getBrandSurfaceColor(),menu.getBrandFont(),menu.getBrandLayout(),menu.isHidePoweredBy()));
    }

    private static boolean isPublic(MenuProduct product) {
        return product.isActive() && !product.isArchived();
    }

    private PublicMenuResponse.ProductResponse toResponse(MenuProduct product,String locale) {
        var t=jdbc.sql("select name,description,allergen_info from product_translation where product_id=:id and tenant_id=:tenant and locale=:locale")
                .param("id",product.getId()).param("tenant",product.getTenantId()).param("locale",locale)
                .query((rs,n)->new Text(rs.getString(1),rs.getString(2),rs.getString(3))).optional();
        return new PublicMenuResponse.ProductResponse(
                product.getId(),
                t.map(Text::name).orElse(product.getName()),
                t.map(Text::description).orElse(product.getDescription()),
                t.map(Text::allergens).orElse(product.getAllergenInfo()),
                product.getImageUrl(),
                product.getPrice(),
                product.getCurrency(),
                product.isAvailable());
    }
    private String categoryName(MenuCategory c,String locale){return jdbc.sql("select name from category_translation where category_id=:id and tenant_id=:t and locale=:l").param("id",c.getId()).param("t",c.getTenantId()).param("l",locale).query(String.class).optional().orElse(c.getName());}
    private UUID menuId(String slug,UUID tenant){return jdbc.sql("select id from menu where slug=:s and tenant_id=:t").param("s",slug).param("t",tenant).query(UUID.class).single();}
    private record Text(String name,String description,String allergens){}
}
