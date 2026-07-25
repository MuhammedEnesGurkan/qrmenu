package com.masaakis.order.api;

import com.masaakis.order.application.TableAdminService;
import com.masaakis.security.StaffPrincipal;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.net.URI;import java.util.List;import java.util.Map;import java.util.UUID;

@RestController @RequestMapping("/api/admin/tables")
public class TableAdminController{private final TableAdminService service;public TableAdminController(TableAdminService service){this.service=service;}
 @GetMapping List<TableAdminService.AreaView> list(@AuthenticationPrincipal StaffPrincipal p){return service.list(p);}
 @PostMapping("/areas") ResponseEntity<Map<String,UUID>> area(@AuthenticationPrincipal StaffPrincipal p,@Valid @RequestBody AreaRequest r){UUID id=service.createArea(p,r.name(),r.sortOrder());return ResponseEntity.created(URI.create("/api/admin/tables/areas/"+id)).body(Map.of("id",id));}
 @PostMapping ResponseEntity<TableAdminService.TableQr> table(@AuthenticationPrincipal StaffPrincipal p,@Valid @RequestBody TableRequest r){return ResponseEntity.ok(service.createTable(p,r.areaId(),r.name(),r.capacity()));}
 @PostMapping("/{id}/rotate") TableAdminService.TableQr rotate(@AuthenticationPrincipal StaffPrincipal p,@PathVariable UUID id){return service.rotate(p,id);}
 public record AreaRequest(@NotBlank @Size(max=140)String name,@Min(0)@Max(10000)int sortOrder){}
 public record TableRequest(@NotNull UUID areaId,@NotBlank@Size(max=100)String name,@Min(1)@Max(100)Integer capacity){}
}
