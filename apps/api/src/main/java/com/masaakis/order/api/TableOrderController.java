package com.masaakis.order.api;

import com.masaakis.order.application.OrderService;
import com.masaakis.order.application.TableSessionService;
import com.masaakis.security.AppException;
import jakarta.servlet.http.Cookie;import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;import jakarta.validation.constraints.*;
import org.springframework.http.HttpStatus;import org.springframework.http.ResponseEntity;import org.springframework.web.bind.annotation.*;
import java.net.URI;import java.util.Arrays;import java.util.List;import java.util.Map;import java.util.UUID;

@RestController @RequestMapping("/api/table")
public class TableOrderController{private final TableSessionService sessions;private final OrderService orders;public TableOrderController(TableSessionService s,OrderService o){sessions=s;orders=o;}
 @GetMapping("/context") Map<String,Object> context(HttpServletRequest r){var c=contextOf(r);return Map.of("tableId",c.tableId(),"tableName",c.tableName(),"areaName",c.areaName());}
 @GetMapping("/menu") OrderService.TableMenu menu(HttpServletRequest r){return orders.tableMenu(contextOf(r));}
 @PostMapping("/orders") ResponseEntity<OrderService.OrderView> create(HttpServletRequest r,@RequestHeader("Idempotency-Key")@Pattern(regexp="[A-Za-z0-9_-]{16,100}")String key,@Valid@RequestBody CreateOrderRequest body){var c=contextOf(r);sessions.requireCsrf(c,r.getHeader("X-CSRF-Token"));var created=orders.create(c,key,body.items().stream().map(i->new OrderService.CreateItem(i.productId(),i.quantity(),i.notes())).toList(),body.customerNote(),body.serviceMode());return ResponseEntity.created(URI.create("/api/table/orders/"+created.id())).body(created);}
 @GetMapping("/orders/{id}") OrderService.OrderView get(HttpServletRequest r,@PathVariable UUID id){return orders.getForSession(contextOf(r),id);}
 @PostMapping("/waiter-calls") ResponseEntity<Map<String,UUID>> call(HttpServletRequest r,@Valid@RequestBody CallRequest body){var c=contextOf(r);sessions.requireCsrf(c,r.getHeader("X-CSRF-Token"));UUID id=orders.callWaiter(c,body.message());return ResponseEntity.created(URI.create("/api/table/waiter-calls/"+id)).body(Map.of("id",id));}
 private TableSessionService.TableContext contextOf(HttpServletRequest r){return sessions.require(cookie(r,TableSessionService.COOKIE));}
 private String cookie(HttpServletRequest r,String name){if(r.getCookies()==null)return null;return Arrays.stream(r.getCookies()).filter(c->name.equals(c.getName())).map(Cookie::getValue).findFirst().orElse(null);}
 public record CreateOrderRequest(@NotEmpty@Size(max=30)List<@Valid ItemRequest>items,@Size(max=500)String customerNote,@NotBlank@Pattern(regexp="DINE_IN|SELF_SERVICE")String serviceMode){}
 public record ItemRequest(@NotNull UUID productId,@Min(1)@Max(50)int quantity,@Size(max=300)String notes){}public record CallRequest(@Size(max=200)String message){}
}
