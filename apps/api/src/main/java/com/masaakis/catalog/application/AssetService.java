package com.masaakis.catalog.application;

import com.masaakis.security.AppException;
import com.masaakis.security.SecurityHashes;
import com.masaakis.security.StaffPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.UUID;

@Service
public class AssetService {
    private static final int MAX_BYTES = 5 * 1024 * 1024;
    private static final int MAX_DIMENSION = 4096;
    private static final long MAX_PIXELS = 16_000_000L;
    private final JdbcClient jdbc;

    public AssetService(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Transactional
    public UUID upload(StaffPrincipal principal, MultipartFile file) {
        principal.require("catalog/write");
        if (file.isEmpty() || file.getSize() > MAX_BYTES) {
            throw invalid("Görsel boş olamaz ve 5 MB sınırını aşamaz.");
        }
        byte[] encoded = reencode(file);
        String digest = SecurityHashes.sha256(encoded);
        var existing = jdbc.sql("select id from asset_object where tenant_id=:tenantId and sha256=:sha")
                .param("tenantId", principal.tenantId()).param("sha", digest)
                .query(UUID.class).optional();
        if (existing.isPresent()) return existing.get();
        UUID id = UUID.randomUUID();
        jdbc.sql("""
                insert into asset_object (id, tenant_id, content_type, byte_size, sha256, content)
                values (:id, :tenantId, 'image/png', :size, :sha, :content)
                """).param("id", id).param("tenantId", principal.tenantId())
                .param("size", encoded.length).param("sha", digest).param("content", encoded).update();
        return id;
    }

    @Transactional(readOnly = true)
    public AssetData get(UUID id) {
        return jdbc.sql("select content_type, content, sha256 from asset_object where id=:id")
                .param("id", id)
                .query((rs, n) -> new AssetData(rs.getString("content_type"),
                        rs.getBytes("content"), rs.getString("sha256")))
                .optional().orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND,
                        "ASSET_NOT_FOUND", "Görsel bulunamadı."));
    }

    private byte[] reencode(MultipartFile file) {
        try {
            byte[] input = file.getBytes();
            BufferedImage image = ImageIO.read(new ByteArrayInputStream(input));
            if (image == null || image.getWidth() <= 0 || image.getHeight() <= 0
                    || image.getWidth() > MAX_DIMENSION || image.getHeight() > MAX_DIMENSION
                    || (long) image.getWidth() * image.getHeight() > MAX_PIXELS) {
                throw invalid("Desteklenmeyen veya aşırı büyük görsel.");
            }
            var output = new ByteArrayOutputStream();
            if (!ImageIO.write(image, "png", output) || output.size() > MAX_BYTES) {
                throw invalid("Görsel güvenli PNG biçimine dönüştürülemedi.");
            }
            return output.toByteArray();
        } catch (IOException exception) {
            throw invalid("Görsel okunamadı.");
        }
    }

    private static AppException invalid(String message) {
        return new AppException(HttpStatus.BAD_REQUEST, "INVALID_IMAGE", message);
    }

    public record AssetData(String contentType, byte[] content, String sha256) {}
}
