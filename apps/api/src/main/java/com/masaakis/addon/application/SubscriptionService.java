package com.masaakis.addon.application;

import com.masaakis.security.AppException;
import com.masaakis.security.SecurityHashes;
import com.masaakis.security.StaffPrincipal;
import com.masaakis.security.StaffRole;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

@Service
public class SubscriptionService {
    private final JdbcClient jdbc;
    private final String webhookSecret;
    public SubscriptionService(JdbcClient jdbc, @Value("${app.billing-webhook-secret}") String webhookSecret) {
        this.jdbc=jdbc; this.webhookSecret=webhookSecret;
    }

    @Transactional(readOnly=true)
    public List<PlanView> plans(StaffPrincipal principal) {
        principal.require("read");
        return jdbc.sql("""
                select ap.code,ap.name,ap.description,ap.monthly_price,ap.currency,ap.trial_days,
                       coalesce(s.status,'INACTIVE') status,s.trial_ends_at,s.current_period_ends_at,
                       coalesce(s.cancel_at_period_end,false) cancel_at_period_end,s.provider_reference
                from addon_plan ap left join addon_subscription s
                  on s.addon_plan_id=ap.id and s.tenant_id=:tenantId
                where ap.active=true order by ap.monthly_price,ap.code
                """).param("tenantId",principal.tenantId())
                .query((rs,n)->new PlanView(rs.getString("code"),rs.getString("name"),rs.getString("description"),
                        rs.getBigDecimal("monthly_price"),rs.getString("currency"),rs.getInt("trial_days"),
                        rs.getString("status"),rs.getObject("trial_ends_at",OffsetDateTime.class),
                        rs.getObject("current_period_ends_at",OffsetDateTime.class),rs.getBoolean("cancel_at_period_end"),
                        rs.getString("provider_reference")))
                .list();
    }

    @Transactional
    public void startTrial(StaffPrincipal principal,String code){
        owner(principal);
        var plan=jdbc.sql("select id,trial_days from addon_plan where code=:code and active=true").param("code",code)
                .query((rs,n)->new Plan(rs.getObject("id",UUID.class),rs.getInt("trial_days"))).optional()
                .orElseThrow(()->new AppException(HttpStatus.NOT_FOUND,"ADDON_NOT_FOUND","Eklenti bulunamadı."));
        long existing=jdbc.sql("select count(*) from addon_subscription where tenant_id=:tenantId and addon_plan_id=:planId")
                .param("tenantId",principal.tenantId()).param("planId",plan.id).query(Long.class).single();
        if(existing>0)throw new AppException(HttpStatus.CONFLICT,"TRIAL_ALREADY_USED","Bu eklenti için deneme daha önce kullanılmış.");
        UUID subscriptionId=UUID.randomUUID();
        OffsetDateTime now=OffsetDateTime.now(ZoneOffset.UTC);
        OffsetDateTime until=now.plusDays(plan.trialDays);
        jdbc.sql("""
                insert into addon_subscription(id,tenant_id,addon_plan_id,status,provider,provider_reference,starts_at,trial_ends_at,current_period_ends_at)
                values(:id,:tenantId,:planId,'TRIAL','MOCK',:reference,:starts,:trialEnds,:periodEnds)
                """).param("id",subscriptionId).param("tenantId",principal.tenantId()).param("planId",plan.id)
                .param("reference","mock_"+subscriptionId).param("starts",now).param("trialEnds",until).param("periodEnds",until).update();
        jdbc.sql("""
                insert into tenant_addon(id,tenant_id,addon_plan_id,subscription_id,enabled,valid_from,valid_until)
                values(:id,:tenantId,:planId,:subscriptionId,true,:starts,:until)
                """).param("id",UUID.randomUUID()).param("tenantId",principal.tenantId()).param("planId",plan.id)
                .param("subscriptionId",subscriptionId).param("starts",now).param("until",until).update();
    }

    @Transactional
    public void cancel(StaffPrincipal principal,String code){
        owner(principal);
        int changed=jdbc.sql("""
                update addon_subscription s set cancel_at_period_end=true,updated_at=now(),version=version+1
                from addon_plan ap where ap.id=s.addon_plan_id and s.tenant_id=:tenantId and ap.code=:code
                  and s.status in ('TRIAL','ACTIVE')
                """).param("tenantId",principal.tenantId()).param("code",code).update();
        if(changed==0)throw new AppException(HttpStatus.CONFLICT,"SUBSCRIPTION_NOT_ACTIVE","Etkin abonelik bulunamadı.");
    }

    public boolean validSignature(String body,String signature){
        if(signature==null)return false;
        try{Mac mac=Mac.getInstance("HmacSHA256");mac.init(new SecretKeySpec(webhookSecret.getBytes(StandardCharsets.UTF_8),"HmacSHA256"));
            byte[] expected=HexFormat.of().formatHex(mac.doFinal(body.getBytes(StandardCharsets.UTF_8))).getBytes(StandardCharsets.US_ASCII);
            return MessageDigest.isEqual(expected,signature.toLowerCase().getBytes(StandardCharsets.US_ASCII));
        }catch(Exception e){throw new IllegalStateException(e);}
    }

    @Transactional
    public boolean applyWebhook(String eventId,String reference,String status,String eventType,String rawBody){
        int inserted=jdbc.sql("""
                insert into billing_event(id,provider,external_event_id,event_type,payload_sha256)
                values(:id,'MOCK',:eventId,:eventType,:sha) on conflict(provider,external_event_id) do nothing
                """).param("id",UUID.randomUUID()).param("eventId",eventId).param("eventType",eventType)
                .param("sha",SecurityHashes.sha256(rawBody)).update();
        if(inserted==0)return false;
        if(!List.of("ACTIVE","PAST_DUE","CANCELLED","SUSPENDED").contains(status))
            throw new AppException(HttpStatus.BAD_REQUEST,"INVALID_SUBSCRIPTION_STATUS","Geçersiz abonelik durumu.");
        int changed=jdbc.sql("""
                update addon_subscription set status=:status,updated_at=now(),version=version+1
                where provider='MOCK' and provider_reference=:reference
                """).param("status",status).param("reference",reference).update();
        if(changed==0)throw new AppException(HttpStatus.NOT_FOUND,"SUBSCRIPTION_NOT_FOUND","Abonelik bulunamadı.");
        jdbc.sql("""
                update tenant_addon ta set enabled=:enabled,updated_at=now()
                from addon_subscription s where s.id=ta.subscription_id and s.provider_reference=:reference
                """).param("enabled",status.equals("ACTIVE")).param("reference",reference).update();
        return true;
    }

    @Scheduled(fixedDelayString="${app.subscription-expiry-interval-ms:60000}")
    @Transactional
    public void expire(){
        jdbc.sql("""
                update addon_subscription set status='EXPIRED',updated_at=now(),version=version+1
                where status in ('TRIAL','ACTIVE') and current_period_ends_at<=now()
                """).update();
        jdbc.sql("""
                update tenant_addon ta set enabled=false,updated_at=now()
                from addon_subscription s where s.id=ta.subscription_id and s.status in ('EXPIRED','SUSPENDED','PAST_DUE')
                """).update();
    }

    private static void owner(StaffPrincipal principal){if(principal.role()!=StaffRole.OWNER)throw new AppException(HttpStatus.FORBIDDEN,"OWNER_REQUIRED","Bu işlem yalnız işletme sahibine açıktır.");}
    private record Plan(UUID id,int trialDays){}
    public record PlanView(String code,String name,String description,java.math.BigDecimal monthlyPrice,String currency,int trialDays,String status,OffsetDateTime trialEndsAt,OffsetDateTime currentPeriodEndsAt,boolean cancelAtPeriodEnd,String providerReference){}
}
