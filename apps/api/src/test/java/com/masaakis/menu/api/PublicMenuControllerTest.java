package com.masaakis.menu.api;

import com.masaakis.menu.application.PublicMenuResponse;
import com.masaakis.menu.application.PublicMenuService;
import com.masaakis.security.ApiExceptionHandler;
import com.masaakis.security.SecurityConfiguration;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PublicMenuController.class)
@Import({SecurityConfiguration.class, ApiExceptionHandler.class})
class PublicMenuControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private PublicMenuService publicMenuService;

    @Test
    void publishedMenuIsPublicAndDoesNotExposeTenantId() throws Exception {
        var product = new PublicMenuResponse.ProductResponse(
                UUID.randomUUID(), "Filtre Kahve", "Taze", null, null,
                new BigDecimal("95.00"), "TRY", true);
        when(publicMenuService.getPublishedMenu("demo-kafe"))
                .thenReturn(new PublicMenuResponse(
                        "demo-kafe", "Demo Kafe", null, null, "tr",
                        List.of(new PublicMenuResponse.CategoryResponse("Kahveler", List.of(product)))));

        mockMvc.perform(get("/api/public/menus/demo-kafe"))
                .andExpect(status().isOk())
                .andExpect(header().string("Referrer-Policy", "no-referrer"))
                .andExpect(jsonPath("$.name").value("Demo Kafe"))
                .andExpect(jsonPath("$.categories[0].products[0].price").value(95.00))
                .andExpect(jsonPath("$.tenantId").doesNotExist());
    }

    @Test
    void malformedSlugIsRejected() throws Exception {
        mockMvc.perform(get("/api/public/menus/INVALID!"))
                .andExpect(status().isBadRequest());
    }
}

