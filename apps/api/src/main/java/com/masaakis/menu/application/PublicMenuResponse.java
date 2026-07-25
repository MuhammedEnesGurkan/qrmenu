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
        List<CategoryResponse> categories,
        List<String> availableLocales,
        Branding branding
) {
    public PublicMenuResponse(String slug,String name,String description,String logoUrl,String locale,List<CategoryResponse>categories){
        this(slug,name,description,logoUrl,locale,categories,List.of(locale),new Branding("#176b52","#fffdf8","SYSTEM","CARDS",false));
    }
    public record Branding(String primaryColor,String surfaceColor,String font,String layout,boolean hidePoweredBy){}
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
