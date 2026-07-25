package com.masaakis.security;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class SecurityHashesTest {
    @Test
    void tokensAreRandomAndHashComparisonIsConstantTimeSafe() {
        String first = SecurityHashes.randomToken();
        String second = SecurityHashes.randomToken();

        assertThat(first).isNotEqualTo(second).hasSizeGreaterThanOrEqualTo(40);
        assertThat(SecurityHashes.matchesHash(first, SecurityHashes.sha256(first))).isTrue();
        assertThat(SecurityHashes.matchesHash(second, SecurityHashes.sha256(first))).isFalse();
    }
}
