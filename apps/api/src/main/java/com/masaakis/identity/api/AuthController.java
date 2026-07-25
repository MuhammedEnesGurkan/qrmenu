package com.masaakis.identity.api;

import com.masaakis.identity.application.AuthResponse;
import com.masaakis.identity.application.IdentityService;
import com.masaakis.security.SessionAuthenticationFilter;
import com.masaakis.security.StaffPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private static final String CSRF_COOKIE = "MASA_CSRF";
    private final IdentityService identityService;
    private final boolean secureCookie;
    private final String sameSite;

    public AuthController(
            IdentityService identityService,
            @Value("${SESSION_COOKIE_SECURE:false}") boolean secureCookie,
            @Value("${SESSION_COOKIE_SAME_SITE:Lax}") String sameSite
    ) {
        this.identityService = identityService;
        this.secureCookie = secureCookie;
        this.sameSite = sameSite;
    }

    @PostMapping("/register")
    AuthView register(@Valid @RequestBody RegisterRequest request, HttpServletResponse response) {
        AuthResponse auth = identityService.register(
                request.email(), request.password(), request.displayName(), request.businessName());
        return setCookies(auth, response);
    }

    @PostMapping("/login")
    AuthView login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest servletRequest,
            HttpServletResponse response
    ) {
        AuthResponse auth = identityService.login(
                request.email(), request.password(), servletRequest.getRemoteAddr());
        return setCookies(auth, response);
    }

    @GetMapping("/me")
    AuthView me(@AuthenticationPrincipal StaffPrincipal principal) {
        return new AuthView(
                principal.userId(), principal.tenantId(), principal.branchId(),
                principal.displayName(), principal.role().name(), principal.permissions());
    }

    @PostMapping("/logout")
    void logout(@AuthenticationPrincipal StaffPrincipal principal, HttpServletResponse response) {
        identityService.logout(principal);
        response.addHeader(HttpHeaders.SET_COOKIE, expiredCookie(
                SessionAuthenticationFilter.SESSION_COOKIE, true).toString());
        response.addHeader(HttpHeaders.SET_COOKIE, expiredCookie(CSRF_COOKIE, false).toString());
    }

    private AuthView setCookies(AuthResponse auth, HttpServletResponse response) {
        response.addHeader(HttpHeaders.SET_COOKIE, cookie(
                SessionAuthenticationFilter.SESSION_COOKIE,
                auth.sessionToken(),
                true,
                identityService.sessionDuration()).toString());
        response.addHeader(HttpHeaders.SET_COOKIE, cookie(
                CSRF_COOKIE,
                auth.csrfToken(),
                false,
                identityService.sessionDuration()).toString());
        return new AuthView(
                auth.userId(), auth.tenantId(), auth.branchId(),
                auth.displayName(), auth.role(), auth.permissions());
    }

    private ResponseCookie cookie(String name, String value, boolean httpOnly, Duration maxAge) {
        return ResponseCookie.from(name, value)
                .httpOnly(httpOnly)
                .secure(secureCookie)
                .sameSite(sameSite)
                .path("/")
                .maxAge(maxAge)
                .build();
    }

    private ResponseCookie expiredCookie(String name, boolean httpOnly) {
        return cookie(name, "", httpOnly, Duration.ZERO);
    }

    public record RegisterRequest(
            @Email @NotBlank @Size(max = 254) String email,
            @NotBlank @Size(min = 12, max = 128) String password,
            @NotBlank @Size(max = 140) String displayName,
            @NotBlank @Size(max = 140) String businessName
    ) {
    }

    public record LoginRequest(
            @Email @NotBlank @Size(max = 254) String email,
            @NotBlank @Size(max = 128) String password
    ) {
    }

    public record AuthView(
            UUID userId,
            UUID tenantId,
            UUID branchId,
            String displayName,
            String role,
            Set<String> permissions
    ) {
    }
}
