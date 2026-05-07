package com.stockpulse.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

@Service
public class AlphaVantageMarketApiService {

    private static final String DEFAULT_BASE_URL = "https://www.alphavantage.co/query";

    private final Environment environment;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public AlphaVantageMarketApiService(Environment environment, ObjectMapper objectMapper) {
        this.environment = environment;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(3))
                .build();
    }

    public Optional<Map<String, Object>> fetchQuote(String symbol) {
        for (String candidate : symbolCandidates(symbol)) {
            Optional<Map<String, Object>> quote = requestJson(Map.of(
                    "function", "GLOBAL_QUOTE",
                    "symbol", candidate
            )).map(root -> normalizeQuote(candidate, root))
                    .filter(row -> !row.isEmpty());

            if (quote.isPresent()) {
                return quote;
            }
        }
        return Optional.empty();
    }

    public Optional<List<Map<String, Object>>> fetchDaily(String symbol) {
        for (String candidate : symbolCandidates(symbol)) {
            Optional<List<Map<String, Object>>> points = requestJson(Map.of(
                    "function", "TIME_SERIES_DAILY",
                    "symbol", candidate,
                    "outputsize", "compact"
            )).map(root -> normalizeDaily(root));

            if (points.isPresent() && !points.get().isEmpty()) {
                return points;
            }
        }
        return Optional.empty();
    }

    public Optional<List<Map<String, Object>>> search(String query, int limit) {
        if (query == null || query.isBlank()) {
            return Optional.empty();
        }

        return requestJson(Map.of(
                "function", "SYMBOL_SEARCH",
                "keywords", query.trim()
        )).map(root -> normalizeSearch(root, limit))
                .filter(matches -> !matches.isEmpty());
    }

    private Optional<JsonNode> requestJson(Map<String, String> params) {
        String apiKey = firstNonBlank(
                environment.getProperty("ALPHA_VANTAGE_API_KEY"),
                environment.getProperty("ALPHAVANTAGE_API_KEY")
        );
        if (isBlank(apiKey)) {
            return Optional.empty();
        }

        String baseUrl = firstNonBlank(environment.getProperty("ALPHA_VANTAGE_BASE_URL"), DEFAULT_BASE_URL);
        String url = baseUrl + "?" + encodeParams(params, apiKey);

        try {
            HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                    .timeout(Duration.ofSeconds(4))
                    .GET()
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                return Optional.empty();
            }

            JsonNode root = objectMapper.readTree(response.body());
            if (root.hasNonNull("Error Message") || root.hasNonNull("Note") || root.hasNonNull("Information")) {
                return Optional.empty();
            }
            return Optional.of(root);
        } catch (IOException | InterruptedException | IllegalArgumentException ex) {
            if (ex instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            return Optional.empty();
        }
    }

    private Map<String, Object> normalizeQuote(String requestedSymbol, JsonNode root) {
        JsonNode quoteNode = root.path("Global Quote");
        String symbol = firstText(quoteNode, "01. symbol");
        double price = parseDouble(firstText(quoteNode, "05. price"), Double.NaN);
        if (isBlank(symbol) || !Double.isFinite(price)) {
            return Map.of();
        }

        double open = parseDouble(firstText(quoteNode, "02. open"), price);
        double high = parseDouble(firstText(quoteNode, "03. high"), price);
        double low = parseDouble(firstText(quoteNode, "04. low"), price);
        double previousClose = parseDouble(firstText(quoteNode, "08. previous close"), price);
        double change = parseDouble(firstText(quoteNode, "09. change"), price - previousClose);
        double changePercent = parseDouble(firstText(quoteNode, "10. change percent"), 0D);
        String volume = firstText(quoteNode, "06. volume");

        Map<String, Object> quote = new LinkedHashMap<>();
        quote.put("symbol", symbol);
        quote.put("name", symbol);
        quote.put("price", format(price));
        quote.put("change", format(change));
        quote.put("changePercent", format(changePercent));
        quote.put("open", format(open));
        quote.put("high", format(high));
        quote.put("low", format(low));
        quote.put("volume", isBlank(volume) ? "0" : volume);
        quote.put("pe", "");
        quote.put("pb", "");
        quote.put("roe", "");
        quote.put("revenueGrowth", "");
        quote.put("source", "alpha_vantage");
        quote.put("requestedSymbol", requestedSymbol);
        quote.put("orderBook", Map.of("asks", List.of(), "bids", List.of()));
        return quote;
    }

    private List<Map<String, Object>> normalizeDaily(JsonNode root) {
        JsonNode timeSeries = root.path("Time Series (Daily)");
        if (!timeSeries.isObject()) {
            return List.of();
        }

        List<Map<String, Object>> points = new ArrayList<>();
        timeSeries.fields().forEachRemaining(entry -> {
            JsonNode item = entry.getValue();
            Map<String, Object> point = new LinkedHashMap<>();
            point.put("date", entry.getKey());
            point.put("open", format(parseDouble(firstText(item, "1. open"), Double.NaN)));
            point.put("high", format(parseDouble(firstText(item, "2. high"), Double.NaN)));
            point.put("low", format(parseDouble(firstText(item, "3. low"), Double.NaN)));
            point.put("close", format(parseDouble(firstText(item, "4. close"), Double.NaN)));
            point.put("volume", Math.max(0L, Math.round(parseDouble(firstText(item, "5. volume"), 0D))));
            points.add(point);
        });

        points.sort(Comparator.comparing(point -> String.valueOf(point.get("date"))));
        return points;
    }

    private List<Map<String, Object>> normalizeSearch(JsonNode root, int limit) {
        JsonNode matches = root.path("bestMatches");
        if (!matches.isArray()) {
            return List.of();
        }

        List<Map<String, Object>> results = new ArrayList<>();
        for (JsonNode item : matches) {
            String symbol = firstText(item, "1. symbol");
            if (isBlank(symbol)) {
                continue;
            }

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("code", symbol);
            row.put("symbol", symbol);
            row.put("name", firstText(item, "2. name"));
            row.put("price", null);
            row.put("changePercent", "0.00");
            row.put("region", firstText(item, "4. region"));
            row.put("currency", firstText(item, "8. currency"));
            row.put("source", "alpha_vantage");
            results.add(row);
            if (results.size() >= limit) {
                break;
            }
        }
        return results;
    }

    private List<String> symbolCandidates(String rawSymbol) {
        if (rawSymbol == null || rawSymbol.isBlank()) {
            return List.of();
        }

        String normalized = rawSymbol.trim().toUpperCase(Locale.ROOT);
        List<String> candidates = new ArrayList<>();
        candidates.add(normalized);

        if (normalized.matches("\\d{6}")) {
            if (normalized.startsWith("0") || normalized.startsWith("2") || normalized.startsWith("3")) {
                candidates.add(normalized + ".SHZ");
                candidates.add(normalized + ".SZ");
            } else {
                candidates.add(normalized + ".SHH");
                candidates.add(normalized + ".SS");
            }
        }

        return candidates.stream().distinct().toList();
    }

    private String encodeParams(Map<String, String> params, String apiKey) {
        Map<String, String> allParams = new LinkedHashMap<>(params);
        allParams.put("apikey", apiKey);

        StringBuilder builder = new StringBuilder();
        for (Map.Entry<String, String> entry : allParams.entrySet()) {
            if (builder.length() > 0) {
                builder.append('&');
            }
            builder.append(URLEncoder.encode(entry.getKey(), StandardCharsets.UTF_8));
            builder.append('=');
            builder.append(URLEncoder.encode(entry.getValue(), StandardCharsets.UTF_8));
        }
        return builder.toString();
    }

    private String firstText(JsonNode node, String key) {
        JsonNode value = node.path(key);
        return value.isMissingNode() || value.isNull() ? "" : value.asText("").trim();
    }

    private double parseDouble(String value, double fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        try {
            return Double.parseDouble(value.replace("%", "").replace(",", "").trim());
        } catch (NumberFormatException ex) {
            return fallback;
        }
    }

    private String format(double value) {
        if (!Double.isFinite(value)) {
            return "--";
        }
        return String.format(Locale.US, "%.2f", value);
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
