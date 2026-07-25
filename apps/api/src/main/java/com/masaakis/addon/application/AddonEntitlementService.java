package com.masaakis.addon.application;

import com.masaakis.security.AppException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class AddonEntitlementService {
    private final JdbcClient jdbc;
    public AddonEntitlementService(JdbcClient jdbc) { this.jdbc = jdbc; }

    public boolean active(UUID tenantId, String code) {
        long count = jdbc.sql("""
                select count(*) from tenant_addon ta
                join addon_plan ap on ap.id=ta.addon_plan_id and ap.active=true
                join addon_subscription s on s.id=ta.subscription_id
                where ta.tenant_id=:tenantId and ap.code=:code and ta.enabled=true
                  and s.status in ('TRIAL','ACTIVE')
                  and (ta.valid_from is null or ta.valid_from <= now())
                  and (ta.valid_until is null or ta.valid_until > now())
                """).param("tenantId", tenantId).param("code", code).query(Long.class).single();
        return count > 0;
    }

    public void require(UUID tenantId, String code) {
        if (!active(tenantId, code)) throw new AppException(HttpStatus.FORBIDDEN,
                "ADDON_NOT_ACTIVE", "Bu işlem için " + code + " eklentisi etkin olmalı.");
    }
}
