package com.masaakis.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Component
public class CsrfProtectionFilter extends OncePerRequestFilter {
    private static final String HEADER = "X-CSRF-Token";

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String method = request.getMethod();
        boolean safe = method.equals("GET") || method.equals("HEAD") || method.equals("OPTIONS");
        boolean protectedPath = request.getRequestURI().startsWith("/api/admin/")
                || request.getRequestURI().equals("/api/auth/logout");
        return safe || !protectedPath;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof StaffPrincipal principal)) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = request.getHeader(HEADER);
        if (token == null || !SecurityHashes.matchesHash(token, principal.csrfHash())) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setCharacterEncoding(StandardCharsets.UTF_8.name());
            response.getWriter().write(
                    "{\"status\":403,\"code\":\"CSRF_INVALID\",\"message\":\"CSRF doğrulaması başarısız.\"}");
            return;
        }
        filterChain.doFilter(request, response);
    }
}
