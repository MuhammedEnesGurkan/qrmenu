package com.masaakis.addon.application;

import com.masaakis.security.AppException;
import com.masaakis.security.StaffPrincipal;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class AddonGuardAspect {
    private final AddonEntitlementService entitlements;
    public AddonGuardAspect(AddonEntitlementService entitlements) { this.entitlements = entitlements; }

    @Before("@annotation(required)")
    public void require(RequiresAddon required) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!(principal instanceof StaffPrincipal staff)) throw new AppException(HttpStatus.UNAUTHORIZED,
                "AUTH_REQUIRED", "Oturum gerekli.");
        entitlements.require(staff.tenantId(), required.value());
    }
}
