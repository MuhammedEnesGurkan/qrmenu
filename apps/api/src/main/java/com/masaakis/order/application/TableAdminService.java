package com.masaakis.order.application;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.MultiFormatWriter;
import com.google.zxing.WriterException;
import com.google.zxing.common.BitMatrix;
import com.masaakis.addon.application.RequiresAddon;
import com.masaakis.security.AppException;
import com.masaakis.security.SecurityHashes;
import com.masaakis.security.StaffPrincipal;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class TableAdminService {
    private final JdbcClient jdbc; private final String publicBaseUrl;
    public TableAdminService(JdbcClient jdbc,@Value("${app.public-base-url:http://localhost:3000}")String publicBaseUrl){
        this.jdbc=jdbc;this.publicBaseUrl=publicBaseUrl.replaceAll("/+$","");
    }

    @Transactional(readOnly=true)
    public List<AreaView> list(StaffPrincipal principal){principal.require("read");
        var areas=jdbc.sql("""
                select id,name,sort_order,active from dining_area where tenant_id=:tenantId and branch_id=:branchId order by sort_order,created_at
                """).param("tenantId",principal.tenantId()).param("branchId",principal.branchId())
                .query((rs,n)->new MutableArea(rs.getObject("id",UUID.class),rs.getString("name"),rs.getInt("sort_order"),rs.getBoolean("active"))).list();
        var byId=new java.util.LinkedHashMap<UUID,MutableArea>();areas.forEach(a->byId.put(a.id,a));
        jdbc.sql("""
                select id,area_id,name,capacity,active from dining_table where tenant_id=:tenantId and branch_id=:branchId order by created_at
                """).param("tenantId",principal.tenantId()).param("branchId",principal.branchId())
                .query((rs,n)->new TableView(rs.getObject("id",UUID.class),rs.getObject("area_id",UUID.class),rs.getString("name"),
                        (Integer)rs.getObject("capacity"),rs.getBoolean("active"))).list()
                .forEach(t->{var a=byId.get(t.areaId());if(a!=null)a.tables.add(t);});
        return areas.stream().map(MutableArea::view).toList();
    }

    @RequiresAddon("TABLE_ORDERING") @Transactional
    public UUID createArea(StaffPrincipal p,String name,int sort){p.require("table/manage");UUID id=UUID.randomUUID();
        jdbc.sql("insert into dining_area(id,tenant_id,branch_id,name,sort_order) values(:id,:tenantId,:branchId,:name,:sort)")
                .param("id",id).param("tenantId",p.tenantId()).param("branchId",p.branchId()).param("name",name.trim()).param("sort",sort).update();return id;}

    @RequiresAddon("TABLE_ORDERING") @Transactional
    public TableQr createTable(StaffPrincipal p,UUID areaId,String name,Integer capacity){p.require("table/manage");ensureArea(p,areaId);UUID id=UUID.randomUUID();
        jdbc.sql("insert into dining_table(id,tenant_id,branch_id,area_id,name,capacity) values(:id,:tenantId,:branchId,:areaId,:name,:capacity)")
                .param("id",id).param("tenantId",p.tenantId()).param("branchId",p.branchId()).param("areaId",areaId).param("name",name.trim()).param("capacity",capacity).update();
        return rotateInternal(p,id);}

    @RequiresAddon("TABLE_ORDERING") @Transactional
    public TableQr rotate(StaffPrincipal p,UUID tableId){p.require("table/manage");
        long count=jdbc.sql("select count(*) from dining_table where id=:id and tenant_id=:tenantId and branch_id=:branchId")
                .param("id",tableId).param("tenantId",p.tenantId()).param("branchId",p.branchId()).query(Long.class).single();
        if(count==0)throw new AppException(HttpStatus.NOT_FOUND,"TABLE_NOT_FOUND","Masa bulunamadı.");return rotateInternal(p,tableId);}

    private TableQr rotateInternal(StaffPrincipal p,UUID tableId){
        jdbc.sql("update table_qr_token set active=false,rotated_at=now() where table_id=:tableId and tenant_id=:tenantId and active=true")
                .param("tableId",tableId).param("tenantId",p.tenantId()).update();
        String raw=SecurityHashes.randomToken();
        jdbc.sql("insert into table_qr_token(id,tenant_id,table_id,token_hash) values(:id,:tenantId,:tableId,:hash)")
                .param("id",UUID.randomUUID()).param("tenantId",p.tenantId()).param("tableId",tableId).param("hash",SecurityHashes.sha256(raw)).update();
        String url=publicBaseUrl+"/q/"+raw;return new TableQr(tableId,url,qr(url));
    }

    private void ensureArea(StaffPrincipal p,UUID id){long count=jdbc.sql("select count(*) from dining_area where id=:id and tenant_id=:tenantId and branch_id=:branchId and active=true")
            .param("id",id).param("tenantId",p.tenantId()).param("branchId",p.branchId()).query(Long.class).single();
        if(count==0)throw new AppException(HttpStatus.NOT_FOUND,"AREA_NOT_FOUND","Alan bulunamadı.");}
    private String qr(String url){try{BitMatrix m=new MultiFormatWriter().encode(url,BarcodeFormat.QR_CODE,640,640,Map.of(EncodeHintType.MARGIN,2));
        BufferedImage image=new BufferedImage(640,640,BufferedImage.TYPE_BYTE_BINARY);for(int y=0;y<640;y++)for(int x=0;x<640;x++)image.setRGB(x,y,m.get(x,y)?0xff000000:0xffffffff);
        var out=new ByteArrayOutputStream();ImageIO.write(image,"png",out);return Base64.getEncoder().encodeToString(out.toByteArray());
    }catch(Exception e){throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR,"QR_GENERATION_FAILED","Masa QR üretilemedi.");}}
    public record TableQr(UUID tableId,String exchangeUrl,String qrPngBase64){}
    public record TableView(UUID id,UUID areaId,String name,Integer capacity,boolean active){}
    public record AreaView(UUID id,String name,int sortOrder,boolean active,List<TableView> tables){}
    private static final class MutableArea{final UUID id;final String name;final int sort;final boolean active;final java.util.ArrayList<TableView>tables=new java.util.ArrayList<>();
        MutableArea(UUID i,String n,int s,boolean a){id=i;name=n;sort=s;active=a;}AreaView view(){return new AreaView(id,name,sort,active,tables);}}
}
