package com.masaakis.security;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class StaffRoleTest {
    @Test
    void rolesFollowLeastPrivilege() {
        assertThat(StaffRole.OWNER.permissions()).contains("tenant/manage", "subscription/manage");
        assertThat(StaffRole.MENU_EDITOR.permissions()).contains("catalog/write", "price/write")
                .doesNotContain("membership/manage", "order/deliver");
        assertThat(StaffRole.WAITER.permissions()).contains("order/deliver")
                .doesNotContain("catalog/write", "order/prepare-ready");
        assertThat(StaffRole.KITCHEN_STAFF.permissions()).contains("order/prepare-ready")
                .doesNotContain("price/write", "order/deliver");
        assertThat(StaffRole.VIEWER.permissions()).containsExactly("read");
    }
}
