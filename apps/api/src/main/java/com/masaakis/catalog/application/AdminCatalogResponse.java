package com.masaakis.catalog.application;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record AdminCatalogResponse(MenuView menu, List<CategoryView> categories) {
    public record MenuView(
            UUID id, String slug, String name, String description, String logoUrl,
            String locale, boolean published) {
    }

    public record CategoryView(
            UUID id, String name, int sortOrder, boolean active, List<ProductView> products) {
    }

    public record ProductView(
            UUID id, UUID categoryId, String sku, String name, String description,
            String allergenInfo, String imageUrl, BigDecimal price, String currency,
            int sortOrder, boolean active, boolean available, long version) {
    }
}
