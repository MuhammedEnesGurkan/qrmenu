package com.masaakis.security;

import com.masaakis.identity.application.IdentityService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;

@Component
public class SessionAuthenticationFilter extends OncePerRequestFilter {
    public static final String SESSION_COOKIE = "MASA_SESSION";
    private final IdentityService identityService;

    public SessionAuthenticationFilter(IdentityService identityService) {
        this.identityService = identityService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String token = cookie(request, SESSION_COOKIE);
        if (token != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            identityService.authenticate(token).ifPresent(principal -> {
                var authorities = principal.permissions().stream()
                        .map(SimpleGrantedAuthority::new)
                        .toList();
                var authentication = UsernamePasswordAuthenticationToken.authenticated(
                        principal, token, authorities);
                SecurityContextHolder.getContext().setAuthentication(authentication);
            });
        }
        filterChain.doFilter(request, response);
    }

    static String cookie(HttpServletRequest request, String name) {
        if (request.getCookies() == null) {
            return null;
        }
        return Arrays.stream(request.getCookies())
                .filter(cookie -> name.equals(cookie.getName()))
                .map(Cookie::getValue)
                .findFirst()
                .orElse(null);
    }
}
