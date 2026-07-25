package com.masaakis.security;

import java.util.Set;
import java.util.UUID;

public record StaffPrincipal(
        UUID sessionId,
        UUID userId,
        UUID tenantId,
        UUID branchId,
        String displayName,
        StaffRole role,
        Set<String> permissions,
        String csrfHash
) {
    public boolean hasPermission(String permission) {
        return permissions.contains(permission);
    }

    public void require(String permission) {
        if (!hasPermission(permission)) {
            throw new AppException(
                    org.springframework.http.HttpStatus.FORBIDDEN,
                    "PERMISSION_DENIED",
                    "Bu işlem için yetkiniz yok.");
        }
    }
}
