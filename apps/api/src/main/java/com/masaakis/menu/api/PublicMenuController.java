package com.masaakis.menu.api;

import com.masaakis.menu.application.PublicMenuResponse;
import com.masaakis.menu.application.PublicMenuService;
import jakarta.validation.constraints.Pattern;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;

@Validated
@RestController
@RequestMapping("/api/public/menus")
public class PublicMenuController {
    private final PublicMenuService publicMenuService;

    public PublicMenuController(PublicMenuService publicMenuService) {
        this.publicMenuService = publicMenuService;
    }

    @GetMapping("/{slug}")
    public ResponseEntity<PublicMenuResponse> getMenu(
            @PathVariable
            @Pattern(regexp = "[a-z0-9](?:[a-z0-9-]{0,118}[a-z0-9])?")
            String slug) {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(Duration.ofSeconds(30)).cachePublic())
                .body(publicMenuService.getPublishedMenu(slug));
    }
}

