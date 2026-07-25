package com.masaakis.identity.api;

import com.masaakis.identity.application.StaffManagementService;
import com.masaakis.security.StaffPrincipal;
import com.masaakis.security.StaffRole;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/staff")
public class StaffController {
    private final StaffManagementService service;
    public StaffController(StaffManagementService service) { this.service = service; }

    @GetMapping
    List<StaffManagementService.StaffView> list(@AuthenticationPrincipal StaffPrincipal principal) {
        return service.list(principal);
    }

    @PostMapping
    ResponseEntity<Map<String, UUID>> create(@AuthenticationPrincipal StaffPrincipal principal,
                                             @Valid @RequestBody CreateStaffRequest request) {
        UUID id = service.create(principal, request.email(), request.displayName(), request.password(), request.role());
        return ResponseEntity.created(URI.create("/api/admin/staff/" + id)).body(Map.of("id", id));
    }

    @PatchMapping("/{id}")
    ResponseEntity<Void> update(@AuthenticationPrincipal StaffPrincipal principal, @PathVariable UUID id,
                                @Valid @RequestBody UpdateStaffRequest request) {
        service.update(principal, id, request.role(), request.active());
        return ResponseEntity.noContent().build();
    }

    public record CreateStaffRequest(@NotBlank @Email @Size(max=254) String email,
                                     @NotBlank @Size(max=140) String displayName,
                                     @NotBlank @Size(min=12,max=128) String password,
                                     @NotNull StaffRole role) {}
    public record UpdateStaffRequest(@NotNull StaffRole role, boolean active) {}
}
