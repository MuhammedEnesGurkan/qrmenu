package com.masaakis.addon.api;

import com.masaakis.addon.application.SubscriptionService;
import com.masaakis.security.StaffPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/addons")
public class AddonController {
    private final SubscriptionService subscriptions;
    public AddonController(SubscriptionService subscriptions){this.subscriptions=subscriptions;}

    @GetMapping
    List<SubscriptionService.PlanView> plans(@AuthenticationPrincipal StaffPrincipal principal){
        return subscriptions.plans(principal);
    }
    @PostMapping("/{code}/trial")
    ResponseEntity<Void> trial(@AuthenticationPrincipal StaffPrincipal principal,@PathVariable String code){
        subscriptions.startTrial(principal,code);return ResponseEntity.noContent().build();
    }
    @PostMapping("/{code}/cancel")
    ResponseEntity<Void> cancel(@AuthenticationPrincipal StaffPrincipal principal,@PathVariable String code){
        subscriptions.cancel(principal,code);return ResponseEntity.noContent().build();
    }
}
