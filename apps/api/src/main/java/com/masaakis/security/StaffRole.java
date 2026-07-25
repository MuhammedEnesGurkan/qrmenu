package com.masaakis.security;

import java.util.Set;

public enum StaffRole {
    OWNER(Set.of(
            "tenant/manage", "catalog/write", "price/write",
            "order/accept-reject", "order/prepare-ready", "order/deliver",
            "membership/manage", "subscription/manage", "table/manage", "read")),
    BRANCH_MANAGER(Set.of(
            "catalog/write", "price/write", "order/accept-reject",
            "order/prepare-ready", "order/deliver", "membership/manage", "table/manage", "read")),
    MENU_EDITOR(Set.of("catalog/write", "price/write", "read")),
    WAITER(Set.of("order/accept-reject", "order/deliver", "read")),
    KITCHEN_STAFF(Set.of("order/prepare-ready", "read")),
    VIEWER(Set.of("read"));

    private final Set<String> permissions;

    StaffRole(Set<String> permissions) {
        this.permissions = permissions;
    }

    public Set<String> permissions() {
        return permissions;
    }
}
