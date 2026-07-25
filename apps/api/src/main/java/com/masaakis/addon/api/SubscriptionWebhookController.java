package com.masaakis.addon.api;

import com.masaakis.addon.application.SubscriptionService;
import com.masaakis.security.AppException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tools.jackson.databind.ObjectMapper;

import java.util.Map;

@RestController
@RequestMapping("/api/webhooks/subscriptions")
public class SubscriptionWebhookController {
    private final SubscriptionService subscriptions;
    private final ObjectMapper mapper;
    public SubscriptionWebhookController(SubscriptionService subscriptions,ObjectMapper mapper){
        this.subscriptions=subscriptions;this.mapper=mapper;
    }

    @PostMapping
    ResponseEntity<Map<String,Object>> receive(@RequestHeader(value="X-Webhook-Signature",required=false)String signature,
                                                @RequestBody String body){
        if(!subscriptions.validSignature(body,signature))throw new AppException(HttpStatus.UNAUTHORIZED,
                "WEBHOOK_SIGNATURE_INVALID","Webhook imzası geçersiz.");
        try{
            var node=mapper.readTree(body);
            String eventId=node.path("eventId").asString();
            String reference=node.path("reference").asString();
            String status=node.path("status").asString();
            String eventType=node.path("eventType").asString();
            if(eventId.isBlank()||reference.isBlank()||status.isBlank()||eventType.isBlank())
                throw new AppException(HttpStatus.BAD_REQUEST,"WEBHOOK_PAYLOAD_INVALID","Webhook alanları eksik.");
            boolean processed=subscriptions.applyWebhook(eventId,reference,status,eventType,body);
            return ResponseEntity.accepted().body(Map.of("processed",processed));
        }catch(AppException exception){throw exception;}
        catch(Exception exception){throw new AppException(HttpStatus.BAD_REQUEST,"WEBHOOK_PAYLOAD_INVALID","Webhook JSON geçersiz.");}
    }
}
