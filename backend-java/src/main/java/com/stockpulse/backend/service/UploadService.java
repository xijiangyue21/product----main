package com.stockpulse.backend.service;

import com.stockpulse.backend.entity.UploadEntity;
import com.stockpulse.backend.exception.ApiException;
import com.stockpulse.backend.repository.UploadRepository;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

@Service
public class UploadService {

    private static final int DEFAULT_EXPIRY_SECONDS = 3600;
    private static final String DEFAULT_FOLDER_PREFIX = "user-content";

    private final Optional<S3Presigner> presigner;
    private final UploadRepository uploadRepository;
    private final EntityResponseMapper mapper;
    private final Environment environment;

    public UploadService(
            Optional<S3Presigner> presigner,
            UploadRepository uploadRepository,
            EntityResponseMapper mapper,
            Environment environment
    ) {
        this.presigner = presigner;
        this.uploadRepository = uploadRepository;
        this.mapper = mapper;
        this.environment = environment;
    }

    public Map<String, Object> createPresignedUrl(String fileName, String fileType, Integer fileSize) {
        if (isBlank(fileName) || isBlank(fileType) || fileSize == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Missing required fields: fileName, fileType, fileSize");
        }
        S3Presigner s3Presigner = presigner.orElseThrow(
                () -> new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "S3 upload is not configured. Please set AWS credentials.")
        );

        int maxSize = maxUploadSize();
        if (fileSize > maxSize) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "File size exceeds " + Math.round(maxSize / (1024.0 * 1024.0)) + "MB limit for " + subscriptionTier() + " tier"
            );
        }

        String uploadId = UUID.randomUUID().toString();
        long timestamp = System.currentTimeMillis();
        String sanitizedFileName = fileName.replaceAll("[^a-zA-Z0-9.-]", "_");
        String folderPrefix = firstNonBlank(
                environment.getProperty("UPLOAD_FOLDER_PREFIX"),
                environment.getProperty("S3_FOLDER_PREFIX"),
                DEFAULT_FOLDER_PREFIX
        );
        String folderName = property("FOLDER_NAME", "default");
        String documentId = property("DOCUMENT_ID", "default-document");
        String key = folderPrefix + "/" + folderName + "/" + documentId + "/" + timestamp + "-" + sanitizedFileName;

        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucketName())
                .key(key)
                .contentType(fileType)
                .build();
        PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                .signatureDuration(Duration.ofSeconds(DEFAULT_EXPIRY_SECONDS))
                .putObjectRequest(putObjectRequest)
                .build();
        PresignedPutObjectRequest signed = s3Presigner.presignPutObject(presignRequest);

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("uploadId", uploadId);
        data.put("presignedUrl", signed.url().toString());
        data.put("s3Key", key);
        data.put("expiresIn", DEFAULT_EXPIRY_SECONDS);
        return data;
    }

    public Map<String, Object> completeUpload(
            String uploadId,
            String fileName,
            Integer fileSize,
            String fileType,
            String s3Key
    ) {
        if (isBlank(uploadId) || isBlank(fileName) || fileSize == null || isBlank(fileType) || isBlank(s3Key)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Missing required fields");
        }

        UploadEntity entity = uploadRepository.findByUploadId(uploadId).orElseGet(UploadEntity::new);
        entity.setUploadId(uploadId);
        entity.setFileName(fileName);
        entity.setFileSize(fileSize);
        entity.setFileType(fileType);
        entity.setS3Key(s3Key);
        entity.setS3Url("https://" + bucketName() + ".s3." + awsRegion() + ".amazonaws.com/" + s3Key);
        entity.setStatus("completed");
        return mapper.upload(uploadRepository.save(entity));
    }

    private int maxUploadSize() {
        return switch (subscriptionTier()) {
            case "STARTER" -> 50 * 1024 * 1024;
            case "PRO" -> 100 * 1024 * 1024;
            case "BUSINESS" -> 500 * 1024 * 1024;
            case "ENTERPRISE" -> 1000 * 1024 * 1024;
            default -> 10 * 1024 * 1024;
        };
    }

    private String subscriptionTier() {
        return property("SUBSCRIPTION_TIER", "FREE").toUpperCase();
    }

    private String bucketName() {
        String bucket = environment.getProperty("BUCKET_NAME");
        if (isBlank(bucket)) {
            bucket = environment.getProperty("S3_BUCKET");
        }
        if (isBlank(bucket)) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "S3 upload is not configured. Please set bucket configuration.");
        }
        return bucket;
    }

    private String awsRegion() {
        String region = environment.getProperty("AWS_REGION");
        if (isBlank(region)) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "S3 upload is not configured. Please set AWS region.");
        }
        return region;
    }

    private String property(String key, String fallback) {
        String value = environment.getProperty(key);
        return isBlank(value) ? fallback : value;
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (!isBlank(value)) {
                return value;
            }
        }
        return "";
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
