package com.masaakis.identity.application;

import com.masaakis.security.AppException;
import com.masaakis.security.StaffPrincipal;
import com.masaakis.security.StaffRole;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class StaffManagementService {
    private final JdbcClient jdbc;
    private final PasswordEncoder passwords;

    public StaffManagementService(JdbcClient jdbc, PasswordEncoder passwords) {
        this.jdbc = jdbc;
        this.passwords = passwords;
    }

    @Transactional(readOnly = true)
    public List<StaffView> list(StaffPrincipal principal) {
        principal.require("membership/manage");
        return jdbc.sql("""
                select u.id, u.email, u.display_name, u.active as user_active,
                       m.role_code, m.active as membership_active, m.branch_id
                from membership m join app_user u on u.id=m.user_id
                where m.tenant_id=:tenantId order by m.created_at
                """).param("tenantId", principal.tenantId())
                .query((rs, n) -> new StaffView(rs.getObject("id", UUID.class),
                        rs.getString("email"), rs.getString("display_name"),
                        rs.getString("role_code"), rs.getBoolean("user_active") && rs.getBoolean("membership_active"),
                        rs.getObject("branch_id", UUID.class)))
                .list();
    }

    @Transactional
    public UUID create(StaffPrincipal principal, String email, String displayName, String password, StaffRole role) {
        principal.require("membership/manage");
        verifyAssignable(principal, role);
        String normalized = email.trim().toLowerCase(Locale.ROOT);
        long exists = jdbc.sql("select count(*) from app_user where lower(email)=:email")
                .param("email", normalized).query(Long.class).single();
        if (exists > 0) throw new AppException(HttpStatus.CONFLICT, "EMAIL_ALREADY_USED", "Bu e-posta zaten kayıtlı.");
        UUID userId = UUID.randomUUID();
        jdbc.sql("""
                insert into app_user (id,email,display_name,password_hash) values (:id,:email,:name,:hash)
                """).param("id", userId).param("email", normalized).param("name", displayName.trim())
                .param("hash", passwords.encode(password)).update();
        jdbc.sql("""
                insert into membership (id,tenant_id,user_id,branch_id,role_code)
                values (:id,:tenantId,:userId,:branchId,:role)
                """).param("id", UUID.randomUUID()).param("tenantId", principal.tenantId())
                .param("userId", userId).param("branchId", principal.branchId()).param("role", role.name()).update();
        audit(principal, "STAFF_CREATED", userId);
        return userId;
    }

    @Transactional
    public void update(StaffPrincipal principal, UUID userId, StaffRole role, boolean active) {
        principal.require("membership/manage");
        verifyAssignable(principal, role);
        String currentRole = jdbc.sql("select role_code from membership where tenant_id=:tenantId and user_id=:userId")
                .param("tenantId", principal.tenantId()).param("userId", userId).query(String.class).optional()
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "STAFF_NOT_FOUND", "Personel bulunamadı."));
        if (principal.role() != StaffRole.OWNER && currentRole.equals(StaffRole.OWNER.name())) forbidden();
        if (principal.userId().equals(userId) && !active) throw new AppException(HttpStatus.CONFLICT,
                "CANNOT_DISABLE_SELF", "Kendi üyeliğinizi devre dışı bırakamazsınız.");
        jdbc.sql("""
                update membership set role_code=:role, active=:active, updated_at=now()
                where tenant_id=:tenantId and user_id=:userId
                """).param("role", role.name()).param("active", active)
                .param("tenantId", principal.tenantId()).param("userId", userId).update();
        if (!active) jdbc.sql("delete from staff_session where user_id=:userId").param("userId", userId).update();
        audit(principal, "STAFF_UPDATED", userId);
    }

    private static void verifyAssignable(StaffPrincipal principal, StaffRole role) {
        if (principal.role() != StaffRole.OWNER && (role == StaffRole.OWNER || role == StaffRole.BRANCH_MANAGER)) forbidden();
    }

    private static void forbidden() {
        throw new AppException(HttpStatus.FORBIDDEN, "ROLE_ASSIGNMENT_FORBIDDEN", "Bu rolü yönetme yetkiniz yok.");
    }

    private void audit(StaffPrincipal principal, String action, UUID objectId) {
        jdbc.sql("""
                insert into audit_log (id,tenant_id,actor_user_id,action,object_type,object_id)
                values (:id,:tenantId,:actor,:action,'app_user',:objectId)
                """).param("id", UUID.randomUUID()).param("tenantId", principal.tenantId())
                .param("actor", principal.userId()).param("action", action).param("objectId", objectId).update();
    }

    public record StaffView(UUID id, String email, String displayName, String role, boolean active, UUID branchId) {}
}
