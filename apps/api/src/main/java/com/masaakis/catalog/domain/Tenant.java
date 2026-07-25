package com.masaakis.catalog.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.util.UUID;

@Entity
@Table(name = "tenant")
public class Tenant {
    @Id
    private UUID id;

    @Column(nullable = false, length = 140)
    private String name;

    @Column(nullable = false)
    private boolean active;

    protected Tenant() {
    }

    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }
}

