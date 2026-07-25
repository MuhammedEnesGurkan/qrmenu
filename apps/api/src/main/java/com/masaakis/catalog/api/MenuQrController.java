package com.masaakis.catalog.api;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.MultiFormatWriter;
import com.google.zxing.WriterException;
import com.google.zxing.common.BitMatrix;
import com.masaakis.catalog.application.AdminCatalogService;
import com.masaakis.security.AppException;
import com.masaakis.security.StaffPrincipal;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/catalog/qr.png")
public class MenuQrController {
    private final AdminCatalogService catalog;
    private final String publicBaseUrl;

    public MenuQrController(AdminCatalogService catalog,
                            @Value("${app.public-base-url:http://localhost:3000}") String publicBaseUrl) {
        this.catalog = catalog;
        this.publicBaseUrl = publicBaseUrl.replaceAll("/+$", "");
    }

    @GetMapping(produces=MediaType.IMAGE_PNG_VALUE)
    ResponseEntity<byte[]> qr(@AuthenticationPrincipal StaffPrincipal principal) {
        principal.require("read");
        String url = publicBaseUrl + "/m/" + catalog.slug(principal);
        try {
            BitMatrix matrix = new MultiFormatWriter().encode(url, BarcodeFormat.QR_CODE, 768, 768,
                    Map.of(EncodeHintType.MARGIN, 2, EncodeHintType.CHARACTER_SET, "UTF-8"));
            BufferedImage image = new BufferedImage(matrix.getWidth(), matrix.getHeight(),
                    BufferedImage.TYPE_BYTE_BINARY);
            for (int y = 0; y < matrix.getHeight(); y++) {
                for (int x = 0; x < matrix.getWidth(); x++) image.setRGB(x, y, matrix.get(x, y) ? 0xff000000 : 0xffffffff);
            }
            var output = new ByteArrayOutputStream();
            ImageIO.write(image, "png", output);
            return ResponseEntity.ok()
                    .contentType(MediaType.IMAGE_PNG)
                    .cacheControl(CacheControl.noStore())
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=menu-qr.png")
                    .body(output.toByteArray());
        } catch (WriterException | IOException exception) {
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "QR_GENERATION_FAILED",
                    "QR dosyası oluşturulamadı.");
        }
    }
}
