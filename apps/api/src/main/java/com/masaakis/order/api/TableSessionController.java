package com.masaakis.order.api;

import com.masaakis.order.application.TableSessionService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.constraints.Pattern;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.time.Duration;

@Validated @RestController @RequestMapping("/api/public/table/exchange")
public class TableSessionController {
    private final TableSessionService sessions;private final boolean secure;private final String sameSite;private final String publicBaseUrl;
    public TableSessionController(TableSessionService sessions,@Value("${SESSION_COOKIE_SECURE:false}")boolean secure,
          @Value("${SESSION_COOKIE_SAME_SITE:Lax}")String sameSite,@Value("${app.public-base-url:http://localhost:3000}")String publicBaseUrl){
        this.sessions=sessions;this.secure=secure;this.sameSite=sameSite;this.publicBaseUrl=publicBaseUrl.replaceAll("/+$","");}

    @GetMapping("/{token}")
    ResponseEntity<Void> exchange(@PathVariable @Pattern(regexp="[A-Za-z0-9_-]{40,100}")String token,HttpServletResponse response){
        var exchange=sessions.exchange(token);Duration age=Duration.between(java.time.OffsetDateTime.now(java.time.ZoneOffset.UTC),exchange.expiresAt());
        response.addHeader(HttpHeaders.SET_COOKIE,cookie(TableSessionService.COOKIE,exchange.token(),true,age).toString());
        response.addHeader(HttpHeaders.SET_COOKIE,cookie(TableSessionService.CSRF_COOKIE,exchange.csrfToken(),false,age).toString());
        return ResponseEntity.status(303).location(URI.create(publicBaseUrl+"/siparis"))
                .cacheControl(CacheControl.noStore()).header("Referrer-Policy","no-referrer").build();
    }
    private ResponseCookie cookie(String name,String value,boolean httpOnly,Duration age){return ResponseCookie.from(name,value)
            .httpOnly(httpOnly).secure(secure).sameSite(sameSite).path("/").maxAge(age).build();}
}
