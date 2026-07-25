package com.masaakis.catalog.api;

import com.masaakis.catalog.application.AssetService;
import com.masaakis.security.StaffPrincipal;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;
import java.util.Map;
import java.util.UUID;

@RestController
public class AssetController {
    private final AssetService assets;

    public AssetController(AssetService assets) {
        this.assets = assets;
    }

    @PostMapping(value="/api/admin/assets", consumes=MediaType.MULTIPART_FORM_DATA_VALUE)
    Map<String, String> upload(@AuthenticationPrincipal StaffPrincipal principal,
                               @RequestParam("file") MultipartFile file) {
        UUID id = assets.upload(principal, file);
        return Map.of("id", id.toString(), "url", "/api/public/assets/" + id);
    }

    @GetMapping("/api/public/assets/{id}")
    ResponseEntity<byte[]> get(@PathVariable UUID id) {
        var asset = assets.get(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(asset.contentType()))
                .cacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic().immutable())
                .eTag('"' + asset.sha256() + '"')
                .body(asset.content());
    }
}
