package com.masaakis.identity.application;

import com.masaakis.security.AppException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class LoginRateLimiter {
    private static final int LIMIT = 5;
    private static final Duration WINDOW = Duration.ofMinutes(10);
    private final ConcurrentHashMap<String, Deque<Instant>> attempts = new ConcurrentHashMap<>();
    private final Clock clock = Clock.systemUTC();

    public void check(String key) {
        Instant cutoff = clock.instant().minus(WINDOW);
        Deque<Instant> entries = attempts.computeIfAbsent(key, ignored -> new ArrayDeque<>());
        synchronized (entries) {
            while (!entries.isEmpty() && entries.peekFirst().isBefore(cutoff)) {
                entries.removeFirst();
            }
            if (entries.size() >= LIMIT) {
                throw new AppException(
                        HttpStatus.TOO_MANY_REQUESTS,
                        "LOGIN_RATE_LIMITED",
                        "Çok fazla giriş denemesi. Lütfen daha sonra tekrar deneyin.");
            }
            entries.addLast(clock.instant());
        }
    }

    public void success(String key) {
        attempts.remove(key);
    }
}
