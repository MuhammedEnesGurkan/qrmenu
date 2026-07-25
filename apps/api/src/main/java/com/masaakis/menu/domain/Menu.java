package com.masaakis.menu.domain;

import com.masaakis.menu.infrastructure.MenuCategory;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "menu")
public class Menu {
    @Id
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "branch_id", nullable = false)
    private UUID branchId;

    @Column(nullable = false, unique = true, length = 120)
    private String slug;

    @Column(nullable = false, length = 140)
    private String name;

    @Column(length = 500)
    private String description;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Column(nullable = false, length = 8)
    private String locale;

    @Column(nullable = false)
    private boolean published;

    @OneToMany(mappedBy = "menu", cascade = CascadeType.ALL)
    @OrderBy("sortOrder ASC, name ASC")
    private List<MenuCategory> categories = new ArrayList<>();

    protected Menu() {
    }

    public UUID getTenantId() {
        return tenantId;
    }

    public String getSlug() {
        return slug;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public String getLogoUrl() {
        return logoUrl;
    }

    public String getLocale() {
        return locale;
    }

    public List<MenuCategory> getCategories() {
        return List.copyOf(categories);
    }
}

