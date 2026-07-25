package com.masaakis.catalog.api;

import com.masaakis.catalog.application.AdminCatalogResponse;
import com.masaakis.catalog.application.AdminCatalogService;
import com.masaakis.security.StaffPrincipal;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.net.URI;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/catalog")
public class AdminCatalogController {
    private final AdminCatalogService service;

    public AdminCatalogController(AdminCatalogService service) {
        this.service = service;
    }

    @GetMapping
    AdminCatalogResponse get(@AuthenticationPrincipal StaffPrincipal principal) {
        principal.require("read");
        return service.get(principal);
    }

    @PatchMapping("/menu")
    ResponseEntity<Void> updateMenu(@AuthenticationPrincipal StaffPrincipal principal,
                                    @Valid @RequestBody MenuRequest request) {
        service.updateMenu(principal, request.name(), request.description(), request.logoUrl(), request.locale());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/categories")
    ResponseEntity<Map<String, UUID>> createCategory(@AuthenticationPrincipal StaffPrincipal principal,
                                                     @Valid @RequestBody CategoryRequest request) {
        UUID id = service.createCategory(principal, request.name(), request.sortOrder());
        return ResponseEntity.created(URI.create("/api/admin/catalog/categories/" + id)).body(Map.of("id", id));
    }

    @PatchMapping("/categories/{id}")
    ResponseEntity<Void> updateCategory(@AuthenticationPrincipal StaffPrincipal principal, @PathVariable UUID id,
                                        @Valid @RequestBody CategoryUpdateRequest request) {
        service.updateCategory(principal, id, request.name(), request.sortOrder(), request.active());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/categories/{id}")
    ResponseEntity<Void> archiveCategory(@AuthenticationPrincipal StaffPrincipal principal, @PathVariable UUID id) {
        service.archiveCategory(principal, id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/products")
    ResponseEntity<Map<String, UUID>> createProduct(@AuthenticationPrincipal StaffPrincipal principal,
                                                    @Valid @RequestBody ProductRequest request) {
        UUID id = service.createProduct(principal, request.categoryId(), request.sku(), request.name(),
                request.description(), request.allergenInfo(), request.imageUrl(), request.price(),
                request.currency(), request.sortOrder());
        return ResponseEntity.created(URI.create("/api/admin/catalog/products/" + id)).body(Map.of("id", id));
    }

    @PatchMapping("/products/{id}")
    ResponseEntity<Void> updateProduct(@AuthenticationPrincipal StaffPrincipal principal, @PathVariable UUID id,
                                       @Valid @RequestBody ProductUpdateRequest request) {
        service.updateProduct(principal, id, request.categoryId(), request.sku(), request.name(),
                request.description(), request.allergenInfo(), request.imageUrl(), request.sortOrder(), request.active());
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/products/{id}/price")
    ResponseEntity<Void> changePrice(@AuthenticationPrincipal StaffPrincipal principal, @PathVariable UUID id,
                                     @Valid @RequestBody PriceRequest request) {
        service.changePrice(principal, id, request.price(), request.currency(), request.version());
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/products/{id}/availability")
    ResponseEntity<Void> availability(@AuthenticationPrincipal StaffPrincipal principal, @PathVariable UUID id,
                                      @Valid @RequestBody AvailabilityRequest request) {
        service.setAvailability(principal, id, request.available());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/products/{id}")
    ResponseEntity<Void> archiveProduct(@AuthenticationPrincipal StaffPrincipal principal, @PathVariable UUID id) {
        service.archiveProduct(principal, id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/publish")
    ResponseEntity<Void> publish(@AuthenticationPrincipal StaffPrincipal principal) {
        service.publish(principal, true);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/unpublish")
    ResponseEntity<Void> unpublish(@AuthenticationPrincipal StaffPrincipal principal) {
        service.publish(principal, false);
        return ResponseEntity.noContent().build();
    }

    public record MenuRequest(
            @NotBlank @Size(max=140) String name, @Size(max=500) String description,
            @Size(max=500) String logoUrl, @NotBlank @Pattern(regexp="[a-z]{2}(?:-[A-Z]{2})?") String locale) {}
    public record CategoryRequest(@NotBlank @Size(max=140) String name, @Min(0) @Max(10000) int sortOrder) {}
    public record CategoryUpdateRequest(@NotBlank @Size(max=140) String name,
                                        @Min(0) @Max(10000) int sortOrder, boolean active) {}
    public record ProductRequest(
            @NotNull UUID categoryId, @Size(max=80) String sku, @NotBlank @Size(max=180) String name,
            @Size(max=1000) String description, @Size(max=500) String allergenInfo,
            @Size(max=500) String imageUrl, @NotNull @DecimalMin("0.00") BigDecimal price,
            @NotBlank @Pattern(regexp="[A-Z]{3}") String currency, @Min(0) @Max(10000) int sortOrder) {}
    public record ProductUpdateRequest(
            @NotNull UUID categoryId, @Size(max=80) String sku, @NotBlank @Size(max=180) String name,
            @Size(max=1000) String description, @Size(max=500) String allergenInfo,
            @Size(max=500) String imageUrl, @Min(0) @Max(10000) int sortOrder, boolean active) {}
    public record PriceRequest(@NotNull @DecimalMin("0.00") BigDecimal price,
                               @NotBlank @Pattern(regexp="[A-Z]{3}") String currency, @Min(0) long version) {}
    public record AvailabilityRequest(boolean available) {}
}
