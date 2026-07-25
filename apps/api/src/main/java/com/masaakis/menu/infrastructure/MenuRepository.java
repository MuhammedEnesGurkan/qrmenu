package com.masaakis.menu.infrastructure;

import com.masaakis.menu.domain.Menu;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface MenuRepository extends JpaRepository<Menu, UUID> {
    @EntityGraph(attributePaths = "categories")
    @Query("""
            select distinct m from Menu m
            where lower(m.slug) = lower(:slug) and m.published = true
            """)
    Optional<Menu> findPublishedBySlug(@Param("slug") String slug);
}
