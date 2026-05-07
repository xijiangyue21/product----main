package com.stockpulse.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

@Service
public class BailianAiService {

    private static final String DEFAULT_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1";
    private static final String DEFAULT_MODEL = "qwen-plus";

    private final Environment environment;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public BailianAiService(Environment environment, ObjectMapper objectMapper) {
        this.environment = environment;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    public Optional<String> speculationAdvice(Map<String, Object> analysis) {
        String apiKey = firstNonBlank(
                environment.getProperty("BAILIAN_API_KEY"),
                environment.getProperty("DASHSCOPE_API_KEY")
        );
        if (isBlank(apiKey)) {
            return Optional.empty();
        }

        String model = firstNonBlank(environment.getProperty("BAILIAN_MODEL"), DEFAULT_MODEL);
        String baseUrl = firstNonBlank(environment.getProperty("BAILIAN_BASE_URL"), DEFAULT_BASE_URL);

        try {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("model", model);
            body.put("temperature", 0.25);
            body.put("messages", List.of(
                    Map.of(
                            "role", "system",
                            "content", "你是A股短线交易风险助手。只基于用户给出的行情数据输出投资观察和风险提示，不承诺收益，不给确定性买卖指令，必须提醒风险。"
                    ),
                    Map.of(
                            "role", "user",
                            "content", "请基于以下近一年行情分析，给出150字以内的AI投资建议展示文案，包含趋势、风险、观察位和仓位纪律，并说明不构成投资建议："
                                    + objectMapper.writeValueAsString(analysis)
                    )
            ));

            HttpRequest request = HttpRequest.newBuilder(URI.create(resolveChatUrl(baseUrl)))
                    .timeout(Duration.ofSeconds(20))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                return Optional.empty();
            }

            JsonNode root = objectMapper.readTree(response.body());
            String content = root.path("choices").path(0).path("message").path("content").asText("");
            return isBlank(content) ? Optional.empty() : Optional.of(content.trim());
        } catch (IOException | InterruptedException | IllegalArgumentException ex) {
            if (ex instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            return Optional.empty();
        }
    }

    private String resolveChatUrl(String baseUrl) {
        String trimmed = baseUrl.trim();
        while (trimmed.endsWith("/")) {
            trimmed = trimmed.substring(0, trimmed.length() - 1);
        }
        if (trimmed.endsWith("/chat/completions")) {
            return trimmed;
        }
        return trimmed + "/chat/completions";
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (!isBlank(value)) {
                return value.trim();
            }
        }
        return "";
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
