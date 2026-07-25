package com.masaakis.identity.application;

import com.masaakis.security.AppException;
import com.masaakis.security.SecurityHashes;
import com.masaakis.security.StaffPrincipal;
import com.masaakis.security.StaffRole;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.Duration;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

@Service
public class IdentityService {
    private final JdbcClient jdbc;
    private final PasswordEncoder passwordEncoder;
    private final LoginRateLimiter rateLimiter;
    private final Duration sessionDuration = Duration.ofHours(12);

    public IdentityService(
            JdbcClient jdbc,
            PasswordEncoder passwordEncoder,
            LoginRateLimiter rateLimiter
    ) {
        this.jdbc = jdbc;
        this.passwordEncoder = passwordEncoder;
        this.rateLimiter = rateLimiter;
    }

    @Transactional
    public AuthResponse register(
            String email,
            String password,
            String displayName,
            String businessName
    ) {
        String normalizedEmail = normalizeEmail(email);
        long existing = jdbc.sql("select count(*) from app_user where lower(email) = :email")
                .param("email", normalizedEmail)
                .query(Long.class)
                .single();
        if (existing > 0) {
            throw new AppException(HttpStatus.CONFLICT, "EMAIL_ALREADY_USED", "Bu e-posta zaten kayıtlı.");
        }

        UUID userId = UUID.randomUUID();
        UUID tenantId = UUID.randomUUID();
        UUID branchId = UUID.randomUUID();
        UUID menuId = UUID.randomUUID();
        String slug = uniqueSlug(businessName);
        String passwordHash = passwordEncoder.encode(password);

        jdbc.sql("insert into tenant (id, name) values (:id, :name)")
                .param("id", tenantId)
                .param("name", businessName.trim())
                .update();
        jdbc.sql("insert into branch (id, tenant_id, name) values (:id, :tenantId, 'Merkez')")
                .param("id", branchId)
                .param("tenantId", tenantId)
                .update();
        jdbc.sql("""
                insert into menu (id, tenant_id, branch_id, slug, name, locale, published)
                values (:id, :tenantId, :branchId, :slug, :name, 'tr', false)
                """)
                .param("id", menuId)
                .param("tenantId", tenantId)
                .param("branchId", branchId)
                .param("slug", slug)
                .param("name", businessName.trim())
                .update();
        jdbc.sql("""
                insert into app_user (id, email, display_name, password_hash)
                values (:id, :email, :displayName, :passwordHash)
                """)
                .param("id", userId)
                .param("email", normalizedEmail)
                .param("displayName", displayName.trim())
                .param("passwordHash", passwordHash)
                .update();
        jdbc.sql("""
                insert into membership (id, tenant_id, user_id, branch_id, role_code)
                values (:id, :tenantId, :userId, :branchId, 'OWNER')
                """)
                .param("id", UUID.randomUUID())
                .param("tenantId", tenantId)
                .param("userId", userId)
                .param("branchId", branchId)
                .update();
        audit(tenantId, userId, "TENANT_REGISTERED", "tenant", tenantId);
        return createSession(new UserMembership(
                userId, tenantId, branchId, displayName.trim(), passwordHash, StaffRole.OWNER));
    }

    @Transactional
    public AuthResponse login(String email, String password, String remoteAddress) {
        String normalizedEmail = normalizeEmail(email);
        String rateKey = remoteAddress + "|" + normalizedEmail;
        rateLimiter.check(rateKey);

        UserMembership membership = findUser(normalizedEmail)
                .orElseThrow(IdentityService::invalidCredentials);
        if (!passwordEncoder.matches(password, membership.passwordHash())) {
            throw invalidCredentials();
        }
        rateLimiter.success(rateKey);
        jdbc.sql("delete from staff_session where expires_at <= now()").update();
        audit(membership.tenantId(), membership.userId(), "AUTH_LOGIN", "app_user", membership.userId());
        return createSession(membership);
    }

    @Transactional(readOnly = true)
    public Optional<StaffPrincipal> authenticate(String rawToken) {
        String tokenHash = SecurityHashes.sha256(rawToken);
        return jdbc.sql("""
                select s.id as session_id, s.csrf_hash, u.id as user_id, u.display_name,
                       m.tenant_id, m.branch_id, m.role_code
                from staff_session s
                join app_user u on u.id = s.user_id and u.active = true
                join membership m on m.user_id = u.id and m.active = true
                where s.token_hash = :tokenHash and s.expires_at > now()
                order by m.created_at
                limit 1
                """)
                .param("tokenHash", tokenHash)
                .query((rs, rowNum) -> {
                    StaffRole role = StaffRole.valueOf(rs.getString("role_code"));
                    return new StaffPrincipal(
                            rs.getObject("session_id", UUID.class),
                            rs.getObject("user_id", UUID.class),
                            rs.getObject("tenant_id", UUID.class),
                            rs.getObject("branch_id", UUID.class),
                            rs.getString("display_name"),
                            role,
                            role.permissions(),
                            rs.getString("csrf_hash"));
                })
                .optional();
    }

    @Transactional
    public void logout(StaffPrincipal principal) {
        jdbc.sql("delete from staff_session where id = :id")
                .param("id", principal.sessionId())
                .update();
        audit(principal.tenantId(), principal.userId(), "AUTH_LOGOUT", "app_user", principal.userId());
    }

    public Duration sessionDuration() {
        return sessionDuration;
    }

    private Optional<UserMembership> findUser(String normalizedEmail) {
        return jdbc.sql("""
                select u.id as user_id, u.display_name, u.password_hash,
                       m.tenant_id, m.branch_id, m.role_code
                from app_user u
                join membership m on m.user_id = u.id and m.active = true
                where lower(u.email) = :email and u.active = true
                order by m.created_at
                limit 1
                """)
                .param("email", normalizedEmail)
                .query((rs, rowNum) -> new UserMembership(
                        rs.getObject("user_id", UUID.class),
                        rs.getObject("tenant_id", UUID.class),
                        rs.getObject("branch_id", UUID.class),
                        rs.getString("display_name"),
                        rs.getString("password_hash"),
                        StaffRole.valueOf(rs.getString("role_code"))))
                .optional();
    }

    private AuthResponse createSession(UserMembership membership) {
        String token = SecurityHashes.randomToken();
        String csrfToken = SecurityHashes.randomToken();
        jdbc.sql("""
                insert into staff_session (id, user_id, token_hash, csrf_hash, expires_at)
                values (:id, :userId, :tokenHash, :csrfHash, :expiresAt)
                """)
                .param("id", UUID.randomUUID())
                .param("userId", membership.userId())
                .param("tokenHash", SecurityHashes.sha256(token))
                .param("csrfHash", SecurityHashes.sha256(csrfToken))
                .param("expiresAt", OffsetDateTime.ofInstant(
                        Instant.now().plus(sessionDuration), ZoneOffset.UTC))
                .update();
        return new AuthResponse(
                membership.userId(),
                membership.tenantId(),
                membership.branchId(),
                membership.displayName(),
                membership.role().name(),
                membership.role().permissions(),
                token,
                csrfToken);
    }

    private void audit(UUID tenantId, UUID userId, String action, String objectType, UUID objectId) {
        jdbc.sql("""
                insert into audit_log (id, tenant_id, actor_user_id, action, object_type, object_id)
                values (:id, :tenantId, :userId, :action, :objectType, :objectId)
                """)
                .param("id", UUID.randomUUID())
                .param("tenantId", tenantId)
                .param("userId", userId)
                .param("action", action)
                .param("objectType", objectType)
                .param("objectId", objectId)
                .update();
    }

    private String uniqueSlug(String businessName) {
        String normalized = Normalizer.normalize(businessName, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
        if (normalized.isBlank()) {
            normalized = "menu";
        }
        normalized = normalized.substring(0, Math.min(normalized.length(), 100));
        return normalized + "-" + UUID.randomUUID().toString().substring(0, 8);
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private static AppException invalidCredentials() {
        return new AppException(
                HttpStatus.UNAUTHORIZED,
                "INVALID_CREDENTIALS",
                "E-posta veya parola hatalı.");
    }

    private record UserMembership(
            UUID userId,
            UUID tenantId,
            UUID branchId,
            String displayName,
            String passwordHash,
            StaffRole role
    ) {
    }
}
