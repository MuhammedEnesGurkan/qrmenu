package com.masaakis.menu.application;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record PublicMenuResponse(
        String slug,
        String name,
        String description,
        String logoUrl,
        String locale,
        List<CategoryResponse> categories
) {
    public record CategoryResponse(String name, List<ProductResponse> products) {
    }

    public record ProductResponse(
            UUID id,
            String name,
            String description,
            String allergenInfo,
            String imageUrl,
            BigDecimal price,
            String currency,
            boolean available
    ) {
    }
}

