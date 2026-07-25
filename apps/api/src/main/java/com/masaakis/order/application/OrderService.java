package com.masaakis.order.application;

import com.masaakis.addon.application.AddonEntitlementService;
import com.masaakis.addon.application.RequiresAddon;
import com.masaakis.menu.application.PublicMenuResponse;
import com.masaakis.menu.application.PublicMenuService;
import com.masaakis.security.AppException;
import com.masaakis.security.StaffPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
public class OrderService {
    private final JdbcClient jdbc;private final AddonEntitlementService entitlements;private final PublicMenuService menus;
    public OrderService(JdbcClient jdbc,AddonEntitlementService entitlements,PublicMenuService menus){this.jdbc=jdbc;this.entitlements=entitlements;this.menus=menus;}

    @Transactional(readOnly=true)
    public TableMenu tableMenu(TableSessionService.TableContext context){
        String slug=jdbc.sql("select slug from menu where tenant_id=:tenantId and branch_id=:branchId and published=true order by created_at limit 1")
                .param("tenantId",context.tenantId()).param("branchId",context.branchId()).query(String.class).optional()
                .orElseThrow(()->new AppException(HttpStatus.NOT_FOUND,"MENU_NOT_FOUND","Yayınlanmış menü bulunamadı."));
        return new TableMenu(context.tableName(),context.areaName(),menus.getPublishedMenu(slug),entitlements.active(context.tenantId(),"TABLE_ORDERING"),entitlements.active(context.tenantId(),"SELF_SERVICE"));
    }

    @Transactional
    public OrderView create(TableSessionService.TableContext context,String idempotencyKey,List<CreateItem> requested,String note,String serviceMode){
        entitlements.require(context.tenantId(),"TABLE_ORDERING");
        if(!List.of("DINE_IN","SELF_SERVICE").contains(serviceMode))throw bad("SERVICE_MODE_INVALID","Servis biçimi geçersiz.");
        if(serviceMode.equals("SELF_SERVICE"))entitlements.require(context.tenantId(),"SELF_SERVICE");
        if(requested==null||requested.isEmpty()||requested.size()>30)throw bad("ORDER_ITEMS_INVALID","Sipariş 1-30 satır içermeli.");
        var existing=findByKey(context,idempotencyKey);if(existing.isPresent())return existing.get();
        Set<UUID> unique=new HashSet<>();var priced=new ArrayList<PricedItem>();String currency=null;BigDecimal total=BigDecimal.ZERO;
        for(CreateItem item:requested){if(item.quantity()<1||item.quantity()>50||!unique.add(item.productId()))throw bad("ORDER_ITEMS_INVALID","Ürün satırları geçersiz.");
            var product=jdbc.sql("""
                    select p.id,p.name,p.price,p.currency from product p
                    join menu_category c on c.id=p.category_id and c.tenant_id=p.tenant_id
                    join menu m on m.id=c.menu_id and m.tenant_id=c.tenant_id
                    where p.id=:id and p.tenant_id=:tenantId and m.branch_id=:branchId and m.published=true
                      and c.active=true and c.archived=false and p.active=true and p.available=true and p.archived=false
                    """).param("id",item.productId()).param("tenantId",context.tenantId()).param("branchId",context.branchId())
                    .query((rs,n)->new PricedItem(rs.getObject("id",UUID.class),rs.getString("name"),rs.getBigDecimal("price"),
                            rs.getString("currency"),item.quantity(),clean(item.notes(),300))).optional()
                    .orElseThrow(()->bad("PRODUCT_NOT_AVAILABLE","Bir ürün artık mevcut değil."));
            if(currency==null)currency=product.currency();else if(!currency.equals(product.currency()))throw bad("CURRENCY_MISMATCH","Sipariş para birimleri uyuşmuyor.");
            total=total.add(product.price().multiply(BigDecimal.valueOf(product.quantity())));priced.add(product);
        }
        UUID orderId=UUID.randomUUID();int inserted=jdbc.sql("""
                insert into customer_order(id,tenant_id,branch_id,table_id,table_session_id,service_mode,state,idempotency_key,estimated_total,currency,customer_note,pickup_number)
                values(:id,:tenantId,:branchId,:tableId,:sessionId,:serviceMode,'SUBMITTED',:key,:total,:currency,:note,:pickup)
                on conflict(tenant_id,idempotency_key) do nothing
                """).param("id",orderId).param("tenantId",context.tenantId()).param("branchId",context.branchId())
                .param("tableId",context.tableId()).param("sessionId",context.sessionId()).param("key",idempotencyKey)
                .param("serviceMode",serviceMode).param("total",total).param("currency",currency).param("note",clean(note,500))
                .param("pickup",serviceMode.equals("SELF_SERVICE")?"S"+UUID.randomUUID().toString().substring(0,6).toUpperCase():null).update();
        if(inserted==0)return findByKey(context,idempotencyKey).orElseThrow(()->bad("IDEMPOTENCY_CONFLICT","İstek anahtarı başka oturuma ait."));
        for(PricedItem item:priced)jdbc.sql("""
                insert into order_item(id,tenant_id,order_id,product_id,product_name_snapshot,unit_price_snapshot,currency,quantity,notes)
                values(:id,:tenantId,:orderId,:productId,:name,:price,:currency,:quantity,:notes)
                """).param("id",UUID.randomUUID()).param("tenantId",context.tenantId()).param("orderId",orderId)
                .param("productId",item.id()).param("name",item.name()).param("price",item.price()).param("currency",item.currency())
                .param("quantity",item.quantity()).param("notes",item.notes()).update();
        outbox(context.tenantId(),orderId,"ORDER_SUBMITTED");return getForSession(context,orderId);
    }

    @Transactional(readOnly=true)
    public OrderView getForSession(TableSessionService.TableContext context,UUID id){
        var order=order(id,context.tenantId()," and o.table_session_id=:sessionId",Map.of("sessionId",context.sessionId()));
        return order.orElseThrow(()->new AppException(HttpStatus.NOT_FOUND,"ORDER_NOT_FOUND","Sipariş bulunamadı."));}

    @Transactional(readOnly=true)
    public List<OrderView> list(StaffPrincipal p){p.require("read");return jdbc.sql("""
            select id from customer_order where tenant_id=:tenantId and branch_id=:branchId order by submitted_at desc limit 100
            """).param("tenantId",p.tenantId()).param("branchId",p.branchId()).query(UUID.class).list().stream()
            .map(id->order(id,p.tenantId()," and o.branch_id=:branchId",Map.of("branchId",p.branchId())).orElseThrow()).toList();}

    @RequiresAddon("TABLE_ORDERING") @Transactional
    public OrderView transition(StaffPrincipal p,UUID id,String target,long version){
        String current=jdbc.sql("select state from customer_order where id=:id and tenant_id=:tenantId and branch_id=:branchId")
                .param("id",id).param("tenantId",p.tenantId()).param("branchId",p.branchId()).query(String.class).optional()
                .orElseThrow(()->new AppException(HttpStatus.NOT_FOUND,"ORDER_NOT_FOUND","Sipariş bulunamadı."));
        String mode=jdbc.sql("select service_mode from customer_order where id=:id").param("id",id).query(String.class).single();
        requireTransition(p,current,target,mode);int changed=jdbc.sql("""
                update customer_order set state=:target,version=version+1,updated_at=now()
                where id=:id and tenant_id=:tenantId and branch_id=:branchId and state=:current and version=:version
                """).param("target",target).param("id",id).param("tenantId",p.tenantId()).param("branchId",p.branchId())
                .param("current",current).param("version",version).update();
        if(changed==0)throw new AppException(HttpStatus.CONFLICT,"ORDER_VERSION_CONFLICT","Sipariş güncellendi; listeyi yenileyin.");
        if(target.equals("ACCEPTED")&&entitlements.active(p.tenantId(),"KITCHEN_STATIONS"))assignStations(p.tenantId(),id);
        outbox(p.tenantId(),id,"ORDER_"+target);return order(id,p.tenantId()," and o.branch_id=:branchId",Map.of("branchId",p.branchId())).orElseThrow();}

    @Transactional
    public UUID callWaiter(TableSessionService.TableContext c,String message){entitlements.require(c.tenantId(),"TABLE_ORDERING");
        long open=jdbc.sql("select count(*) from waiter_call where table_session_id=:sessionId and status in('PENDING','ACKNOWLEDGED')")
                .param("sessionId",c.sessionId()).query(Long.class).single();if(open>0)throw new AppException(HttpStatus.CONFLICT,"WAITER_CALL_OPEN","Zaten açık bir garson çağrısı var.");
        UUID id=UUID.randomUUID();jdbc.sql("""
                insert into waiter_call(id,tenant_id,branch_id,table_id,table_session_id,message)
                values(:id,:tenantId,:branchId,:tableId,:sessionId,:message)
                """).param("id",id).param("tenantId",c.tenantId()).param("branchId",c.branchId()).param("tableId",c.tableId())
                .param("sessionId",c.sessionId()).param("message",clean(message,200)).update();outbox(c.tenantId(),id,"WAITER_CALLED");return id;}

    @Transactional(readOnly=true)
    public List<WaiterCall> calls(StaffPrincipal p){p.require("read");return jdbc.sql("""
            select w.id,w.table_id,t.name table_name,w.status,w.message,w.created_at from waiter_call w
            join dining_table t on t.id=w.table_id where w.tenant_id=:tenantId and w.branch_id=:branchId
            order by case when w.status='PENDING' then 0 when w.status='ACKNOWLEDGED' then 1 else 2 end,w.created_at desc limit 100
            """).param("tenantId",p.tenantId()).param("branchId",p.branchId())
            .query((rs,n)->new WaiterCall(rs.getObject("id",UUID.class),rs.getObject("table_id",UUID.class),rs.getString("table_name"),
                    rs.getString("status"),rs.getString("message"),rs.getObject("created_at",java.time.OffsetDateTime.class))).list();}

    @RequiresAddon("TABLE_ORDERING") @Transactional
    public void updateCall(StaffPrincipal p,UUID id,String status){p.require("order/deliver");if(!List.of("ACKNOWLEDGED","RESOLVED").contains(status))throw bad("WAITER_CALL_STATE_INVALID","Çağrı durumu geçersiz.");
        int n=jdbc.sql("update waiter_call set status=:status,updated_at=now() where id=:id and tenant_id=:tenantId and branch_id=:branchId")
                .param("status",status).param("id",id).param("tenantId",p.tenantId()).param("branchId",p.branchId()).update();
        if(n==0)throw new AppException(HttpStatus.NOT_FOUND,"WAITER_CALL_NOT_FOUND","Çağrı bulunamadı.");}

    private Optional<OrderView> findByKey(TableSessionService.TableContext c,String key){
        return jdbc.sql("select id from customer_order where tenant_id=:tenantId and table_session_id=:sessionId and idempotency_key=:key")
                .param("tenantId",c.tenantId()).param("sessionId",c.sessionId()).param("key",key).query(UUID.class).optional()
                .flatMap(id->order(id,c.tenantId()," and o.table_session_id=:sessionId",Map.of("sessionId",c.sessionId())));}
    private Optional<OrderView> order(UUID id,UUID tenantId,String scope,Map<String,Object> params){
        var statement=jdbc.sql("""
                select o.id,o.table_id,t.name table_name,o.service_mode,o.state,o.estimated_total,o.currency,o.customer_note,o.pickup_number,o.version,o.submitted_at
                from customer_order o left join dining_table t on t.id=o.table_id
                where o.id=:id and o.tenant_id=:tenantId
                """+scope).param("id",id).param("tenantId",tenantId);for(var e:params.entrySet())statement.param(e.getKey(),e.getValue());
        var base=statement.query((rs,n)->new OrderBase(rs.getObject("id",UUID.class),rs.getObject("table_id",UUID.class),rs.getString("table_name"),
                rs.getString("service_mode"),rs.getString("state"),rs.getBigDecimal("estimated_total"),rs.getString("currency"),
                rs.getString("customer_note"),rs.getString("pickup_number"),rs.getLong("version"),rs.getObject("submitted_at",java.time.OffsetDateTime.class))).optional();
        return base.map(o->new OrderView(o.id,o.tableId,o.tableName,o.serviceMode,o.state,o.total,o.currency,o.note,o.pickupNumber,o.version,o.submittedAt,
                jdbc.sql("select product_id,product_name_snapshot,unit_price_snapshot,currency,quantity,notes from order_item where tenant_id=:tenantId and order_id=:orderId order by created_at")
                        .param("tenantId",tenantId).param("orderId",id).query((rs,n)->new OrderItemView(rs.getObject("product_id",UUID.class),
                                rs.getString("product_name_snapshot"),rs.getBigDecimal("unit_price_snapshot"),rs.getString("currency"),rs.getInt("quantity"),rs.getString("notes"))).list()));}
    private void requireTransition(StaffPrincipal p,String from,String to,String mode){Set<String> allowed=switch(from){case"SUBMITTED"->Set.of("ACCEPTED","REJECTED","CANCELLED");case"ACCEPTED"->Set.of("PREPARING","CANCELLED");case"PREPARING"->mode.equals("SELF_SERVICE")?Set.of("READY_FOR_PICKUP"):Set.of("READY");case"READY"->Set.of("SERVING");case"SERVING"->Set.of("DELIVERED");case"READY_FOR_PICKUP"->Set.of("PICKED_UP");default->Set.of();};
        if(!allowed.contains(to))throw new AppException(HttpStatus.CONFLICT,"ORDER_TRANSITION_INVALID","Sipariş durum geçişi geçersiz.");
        if(Set.of("ACCEPTED","REJECTED","CANCELLED").contains(to))p.require("order/accept-reject");else if(Set.of("PREPARING","READY","READY_FOR_PICKUP").contains(to))p.require("order/prepare-ready");else p.require("order/deliver");}
    private void assignStations(UUID tenantId,UUID orderId){jdbc.sql("""
            update order_item oi set station_id=x.station_id,kitchen_state=case when x.station_id is null then 'UNASSIGNED' else 'QUEUED' end
            from (select oi2.id,(select ksc.station_id from product p join kitchen_station_category ksc on ksc.category_id=p.category_id and ksc.tenant_id=p.tenant_id
              join kitchen_station ks on ks.id=ksc.station_id and ks.active=true where p.id=oi2.product_id limit 1) station_id
              from order_item oi2 where oi2.tenant_id=:tenantId and oi2.order_id=:orderId)x
            where oi.id=x.id
            """).param("tenantId",tenantId).param("orderId",orderId).update();
        long unmapped=jdbc.sql("select count(*) from order_item where tenant_id=:tenantId and order_id=:orderId and station_id is null")
                .param("tenantId",tenantId).param("orderId",orderId).query(Long.class).single();
        if(unmapped>0)throw new AppException(HttpStatus.CONFLICT,"KITCHEN_ROUTING_INCOMPLETE","Tüm ürün kategorilerini etkin bir mutfak istasyonuna bağlayın.");}
    private void outbox(UUID tenantId,UUID id,String type){jdbc.sql("insert into outbox_event(id,tenant_id,aggregate_type,aggregate_id,event_type,payload_json) values(:id,:tenantId,'ORDER',:aggregateId,:type,'{}')")
            .param("id",UUID.randomUUID()).param("tenantId",tenantId).param("aggregateId",id).param("type",type).update();}
    private static AppException bad(String code,String message){return new AppException(HttpStatus.BAD_REQUEST,code,message);}private static String clean(String v,int max){if(v==null||v.isBlank())return null;String s=v.trim();return s.substring(0,Math.min(max,s.length()));}
    private record PricedItem(UUID id,String name,BigDecimal price,String currency,int quantity,String notes){}private record OrderBase(UUID id,UUID tableId,String tableName,String serviceMode,String state,BigDecimal total,String currency,String note,String pickupNumber,long version,java.time.OffsetDateTime submittedAt){}
    public record CreateItem(UUID productId,int quantity,String notes){}
    public record OrderItemView(UUID productId,String name,BigDecimal unitPrice,String currency,int quantity,String notes){}
    public record OrderView(UUID id,UUID tableId,String tableName,String serviceMode,String state,BigDecimal estimatedTotal,String currency,String customerNote,String pickupNumber,long version,java.time.OffsetDateTime submittedAt,List<OrderItemView>items){}
    public record TableMenu(String tableName,String areaName,PublicMenuResponse menu,boolean orderingEnabled,boolean selfServiceEnabled){}
    public record WaiterCall(UUID id,UUID tableId,String tableName,String status,String message,java.time.OffsetDateTime createdAt){}
}
