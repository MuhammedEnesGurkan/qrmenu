package com.masaakis.identity.application;

import java.util.Set;
import java.util.UUID;

public record AuthResponse(
        UUID userId,
        UUID tenantId,
        UUID branchId,
        String displayName,
        String role,
        Set<String> permissions,
        String sessionToken,
        String csrfToken
) {
}
