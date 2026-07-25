package com.masaakis.catalog.application;

import io.minio.BucketExistsArgs;
import io.minio.GetObjectArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.io.ByteArrayInputStream;

@Component
@ConditionalOnProperty(name = "app.object-storage.enabled", havingValue = "true")
public class S3AssetStore {
    private final MinioClient client;
    private final String bucket;

    public S3AssetStore(
            @Value("${app.object-storage.endpoint}") String endpoint,
            @Value("${app.object-storage.access-key}") String access,
            @Value("${app.object-storage.secret-key}") String secret,
            @Value("${app.object-storage.bucket:masaakis-assets}") String bucket) {
        this.client = MinioClient.builder().endpoint(endpoint).credentials(access, secret).build();
        this.bucket = bucket;
    }

    public void put(String key, byte[] bytes) {
        try {
            if (!client.bucketExists(BucketExistsArgs.builder().bucket(bucket).build())) {
                try {
                    client.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
                } catch (Exception race) {
                    if (!client.bucketExists(BucketExistsArgs.builder().bucket(bucket).build())) throw race;
                }
            }
            client.putObject(PutObjectArgs.builder()
                    .bucket(bucket)
                    .object(key)
                    .contentType("image/png")
                    .stream(new ByteArrayInputStream(bytes), (long) bytes.length, -1L)
                    .build());
        } catch (Exception exception) {
            throw new IllegalStateException("Object storage write failed", exception);
        }
    }

    public byte[] get(String key) {
        try (var input = client.getObject(GetObjectArgs.builder().bucket(bucket).object(key).build())) {
            return input.readAllBytes();
        } catch (Exception exception) {
            throw new IllegalStateException("Object storage read failed", exception);
        }
    }
}
