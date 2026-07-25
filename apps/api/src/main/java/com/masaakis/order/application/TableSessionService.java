package com.masaakis.order.application;

import com.masaakis.security.AppException;
import com.masaakis.security.SecurityHashes;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;

@Service
public class TableSessionService {
    public static final String COOKIE="MASA_TABLE"; public static final String CSRF_COOKIE="MASA_TABLE_CSRF";
    private final JdbcClient jdbc;
    public TableSessionService(JdbcClient jdbc){this.jdbc=jdbc;}

    @Transactional
    public Exchange exchange(String rawQrToken){
        var table=jdbc.sql("""
                select t.id table_id,t.tenant_id,t.branch_id,t.name table_name,a.name area_name
                from table_qr_token q join dining_table t on t.id=q.table_id and t.tenant_id=q.tenant_id
                join dining_area a on a.id=t.area_id and a.tenant_id=t.tenant_id
                where q.token_hash=:hash and q.active=true and t.active=true and a.active=true
                """).param("hash",SecurityHashes.sha256(rawQrToken))
                .query((rs,n)->new TableIdentity(rs.getObject("table_id",UUID.class),rs.getObject("tenant_id",UUID.class),
                        rs.getObject("branch_id",UUID.class),rs.getString("table_name"),rs.getString("area_name")))
                .optional().orElseThrow(()->new AppException(HttpStatus.NOT_FOUND,"TABLE_QR_INVALID","Masa QR geçersiz veya yenilenmiş."));
        String token=SecurityHashes.randomToken(),csrf=SecurityHashes.randomToken();
        OffsetDateTime expires=OffsetDateTime.now(ZoneOffset.UTC).plusHours(8);
        jdbc.sql("""
                insert into table_session(id,tenant_id,branch_id,table_id,token_hash,expires_at,csrf_hash)
                values(:id,:tenantId,:branchId,:tableId,:hash,:expires,:csrf)
                """).param("id",UUID.randomUUID()).param("tenantId",table.tenantId()).param("branchId",table.branchId())
                .param("tableId",table.tableId()).param("hash",SecurityHashes.sha256(token)).param("expires",expires)
                .param("csrf",SecurityHashes.sha256(csrf)).update();
        return new Exchange(token,csrf,expires);
    }

    @Transactional(readOnly=true)
    public Optional<TableContext> authenticate(String raw){if(raw==null||raw.isBlank())return Optional.empty();
        return jdbc.sql("""
                select s.id session_id,s.tenant_id,s.branch_id,s.table_id,s.csrf_hash,t.name table_name,a.name area_name
                from table_session s join dining_table t on t.id=s.table_id and t.tenant_id=s.tenant_id
                join dining_area a on a.id=t.area_id and a.tenant_id=t.tenant_id
                where s.token_hash=:hash and s.expires_at>now() and t.active=true
                """).param("hash",SecurityHashes.sha256(raw))
                .query((rs,n)->new TableContext(rs.getObject("session_id",UUID.class),rs.getObject("tenant_id",UUID.class),
                        rs.getObject("branch_id",UUID.class),rs.getObject("table_id",UUID.class),rs.getString("table_name"),
                        rs.getString("area_name"),rs.getString("csrf_hash"))).optional();}

    public TableContext require(String raw){return authenticate(raw).orElseThrow(()->new AppException(HttpStatus.UNAUTHORIZED,"TABLE_SESSION_REQUIRED","Geçerli masa oturumu gerekli."));}
    public void requireCsrf(TableContext context,String rawCsrf){if(rawCsrf==null||!SecurityHashes.matchesHash(rawCsrf,context.csrfHash()))
        throw new AppException(HttpStatus.FORBIDDEN,"CSRF_INVALID","Masa oturumu CSRF doğrulaması başarısız.");}
    private record TableIdentity(UUID tableId,UUID tenantId,UUID branchId,String tableName,String areaName){}
    public record Exchange(String token,String csrfToken,OffsetDateTime expiresAt){}
    public record TableContext(UUID sessionId,UUID tenantId,UUID branchId,UUID tableId,String tableName,String areaName,String csrfHash){}
}
