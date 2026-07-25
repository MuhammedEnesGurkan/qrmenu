package com.masaakis.security;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("prod")
public class ProductionSafetyConfiguration {
    @Value("${SESSION_COOKIE_SECURE:false}")
    boolean secure;
    @Value("${app.billing-webhook-secret:}")
    String billing;
    @Value("${app.public-base-url:}")
    String publicUrl;
    @Value("${app.object-storage.enabled:false}")
    boolean objectStore;
    @Value("${spring.flyway.enabled:true}")
    boolean flyway;

    @PostConstruct
    void verify() {
        if (!secure) throw new IllegalStateException("Production requires Secure cookies");
        if (billing.length() < 32 || billing.equals("local-dev-change-me")) {
            throw new IllegalStateException("Production billing webhook secret must be at least 32 characters");
        }
        if (!publicUrl.startsWith("https://")) {
            throw new IllegalStateException("Production public URL must use HTTPS");
        }
        if (!objectStore) throw new IllegalStateException("Production object storage must be enabled");
        if (flyway) throw new IllegalStateException("Run Flyway as a separate controlled job in production");
    }
}
