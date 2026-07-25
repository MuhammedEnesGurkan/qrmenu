package com.masaakis.menu.application;

import com.masaakis.menu.domain.Menu;
import com.masaakis.menu.infrastructure.MenuCategory;
import com.masaakis.menu.infrastructure.MenuProduct;
import com.masaakis.menu.infrastructure.MenuRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PublicMenuService {
    private final MenuRepository menuRepository;

    public PublicMenuService(MenuRepository menuRepository) {
        this.menuRepository = menuRepository;
    }

    @Transactional(readOnly = true)
    public PublicMenuResponse getPublishedMenu(String slug) {
        Menu menu = menuRepository.findPublishedBySlug(slug)
                .orElseThrow(MenuNotFoundException::new);

        List<PublicMenuResponse.CategoryResponse> categories = menu.getCategories().stream()
                .filter(MenuCategory::isActive)
                .map(category -> new PublicMenuResponse.CategoryResponse(
                        category.getName(),
                        category.getProducts().stream()
                                .filter(PublicMenuService::isPublic)
                                .map(PublicMenuService::toResponse)
                                .toList()))
                .filter(category -> !category.products().isEmpty())
                .toList();

        return new PublicMenuResponse(
                menu.getSlug(),
                menu.getName(),
                menu.getDescription(),
                menu.getLogoUrl(),
                menu.getLocale(),
                categories);
    }

    private static boolean isPublic(MenuProduct product) {
        return product.isActive() && !product.isArchived();
    }

    private static PublicMenuResponse.ProductResponse toResponse(MenuProduct product) {
        return new PublicMenuResponse.ProductResponse(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getAllergenInfo(),
                product.getImageUrl(),
                product.getPrice(),
                product.getCurrency(),
                product.isAvailable());
    }
}

