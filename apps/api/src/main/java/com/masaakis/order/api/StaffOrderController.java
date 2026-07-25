package com.masaakis.order.api;
import com.masaakis.order.application.OrderService;import com.masaakis.security.StaffPrincipal;import jakarta.validation.Valid;import jakarta.validation.constraints.Min;import jakarta.validation.constraints.NotBlank;import jakarta.validation.constraints.Pattern;import org.springframework.http.ResponseEntity;import org.springframework.security.core.annotation.AuthenticationPrincipal;import org.springframework.web.bind.annotation.*;import java.util.List;import java.util.UUID;
@RestController@RequestMapping("/api/admin/orders")public class StaffOrderController{private final OrderService service;public StaffOrderController(OrderService s){service=s;}
 @GetMapping List<OrderService.OrderView> list(@AuthenticationPrincipal StaffPrincipal p){return service.list(p);}
 @PatchMapping("/{id}/state") OrderService.OrderView state(@AuthenticationPrincipal StaffPrincipal p,@PathVariable UUID id,@Valid@RequestBody StateRequest r){return service.transition(p,id,r.state(),r.version());}
 @GetMapping("/waiter-calls") List<OrderService.WaiterCall> calls(@AuthenticationPrincipal StaffPrincipal p){return service.calls(p);}
 @PatchMapping("/waiter-calls/{id}")ResponseEntity<Void>call(@AuthenticationPrincipal StaffPrincipal p,@PathVariable UUID id,@Valid@RequestBody CallStateRequest r){service.updateCall(p,id,r.status());return ResponseEntity.noContent().build();}
 public record StateRequest(@NotBlank@Pattern(regexp="[A-Z_]{3,30}")String state,@Min(0)long version){}public record CallStateRequest(@NotBlank@Pattern(regexp="ACKNOWLEDGED|RESOLVED")String status){}
}
