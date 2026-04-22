package com.stockpulse.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

@Service
public class AliyunMarketApiService {

    private final Environment environment;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public AliyunMarketApiService(Environment environment, ObjectMapper objectMapper) {
        this.environment = environment;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    public Optional<Map<String, Object>> fetchAshareQuote(String code, Map<String, Object> fallbackStock) {
        return requestJson("/stock/a/price", Map.of("symbol", toProviderSymbol(code)))
                .map(root -> unwrapPayload(root))
                .filter(payload -> payload != null && !payload.isMissingNode() && !payload.isNull())
                .map(payload -> normalizeQuote(code, payload, fallbackStock));
    }

    public Optional<Map<String, Object>> fetchAshareSearchItem(String code, Map<String, Object> fallbackStock) {
        return fetchAshareQuote(code, fallbackStock).map(quote -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("code", normalizeCode(code));
            item.put("symbol", quote.getOrDefault("symbol", fallbackStock.getOrDefault("symbol", code)));
            item.put("name", quote.getOrDefault("name", fallbackStock.getOrDefault("name", code)));
            item.put("price", quote.getOrDefault("price", fallbackStock.getOrDefault("price", "0.00")));
            item.put("changePercent", quote.getOrDefault("changePercent", fallbackStock.getOrDefault("changePercent", "0.00")));
            return item;
        });
    }

    public Optional<List<Map<String, Object>>> fetchRankedStocks(int pageSize) {
        Map<String, String> payload = new LinkedHashMap<>();
        payload.put("market", "hs_a");
        payload.put("sort", "changeRate");
        payload.put("asc", "0");
        payload.put("pageNo", "1");
        payload.put("pageSize", String.valueOf(pageSize));

        Optional<JsonNode> response = requestJson("/stock/a/rank", payload);
        if (response.isEmpty()) {
            return Optional.empty();
        }

        JsonNode list = extractList(response.get());
        if (list == null || !list.isArray() || list.isEmpty()) {
            return Optional.empty();
        }

        List<Map<String, Object>> rows = new ArrayList<>();
        int index = 0;
        for (JsonNode item : list) {
            Map<String, Object> row = normalizeRankRow(item, index++);
            if (row != null) {
                rows.add(row);
            }
        }

        return rows.isEmpty() ? Optional.empty() : Optional.of(rows);
    }

    public Optional<List<Map<String, Object>>> fetchKLine(String code) {
        Map<String, String> payload = new LinkedHashMap<>();
        payload.put("symbol", toProviderSymbol(code));
        payload.put("type", "240");
        payload.put("pageSize", "60");

        Optional<JsonNode> response = requestJson("/stock/a/kline", payload);
        if (response.isEmpty()) {
            return Optional.empty();
        }

        JsonNode list = extractList(response.get());
        if (list == null || !list.isArray() || list.isEmpty()) {
            return Optional.empty();
        }

        List<Map<String, Object>> points = new ArrayList<>();
        for (JsonNode item : list) {
            Map<String, Object> point = normalizeKLinePoint(item);
            if (point != null) {
                points.add(point);
            }
        }

        return points.isEmpty() ? Optional.empty() : Optional.of(points);
    }

    public String normalizeCode(String code) {
        String normalized = code == null ? "" : code.trim();
        if (normalized.isEmpty()) {
            return normalized;
        }
        if (normalized.matches("(sh|sz|bj)\\d{6}")) {
            return normalized.substring(2);
        }
        if (normalized.matches("\\d{6}\\.(SH|SZ|BJ)")) {
            return normalized.substring(0, 6);
        }
        if (normalized.matches("\\d{6}")) {
            return normalized;
        }
        return normalized.replaceAll("\\D", "");
    }

    private Optional<JsonNode> requestJson(String path, Map<String, String> data) {
        String endpoint = firstNonBlank(
                environment.getProperty("MARKET_API_BASE_URL"),
                environment.getProperty("ALIYUN_API_ENDPOINT")
        );
        String appCode = firstNonBlank(
                environment.getProperty("MARKET_API_APP_CODE"),
                environment.getProperty("ALIYUN_API_APP_CODE")
        );

        if (isBlank(endpoint) || isBlank(appCode)) {
            return Optional.empty();
        }

        try {
            String formBody = encodeForm(data);
            HttpRequest request = HttpRequest.newBuilder(URI.create(resolveUrl(endpoint, path)))
                    .timeout(Duration.ofSeconds(15))
                    .header("Authorization", "APPCODE " + appCode)
                    .header("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8")
                    .POST(HttpRequest.BodyPublishers.ofString(formBody))
                    .build();

            HttpResponse<byte[]> response = httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                return Optional.empty();
            }

            return Optional.of(objectMapper.readTree(new String(response.body(), StandardCharsets.UTF_8)));
        } catch (IOException | InterruptedException ex) {
            if (ex instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            return Optional.empty();
        }
    }

    private String resolveUrl(String endpoint, String path) {
        if (isBlank(path)) {
            return endpoint;
        }
        if (endpoint.endsWith(path)) {
            return endpoint;
        }
        if (endpoint.endsWith("/") && path.startsWith("/")) {
            return endpoint.substring(0, endpoint.length() - 1) + path;
        }
        if (!endpoint.endsWith("/") && !path.startsWith("/")) {
            return endpoint + "/" + path;
        }
        return endpoint + path;
    }

    private String encodeForm(Map<String, String> data) {
        StringBuilder builder = new StringBuilder();
        for (Map.Entry<String, String> entry : data.entrySet()) {
            if (builder.length() > 0) {
                builder.append('&');
            }
            builder.append(URLEncoder.encode(entry.getKey(), StandardCharsets.UTF_8));
            builder.append('=');
            builder.append(URLEncoder.encode(entry.getValue(), StandardCharsets.UTF_8));
        }
        return builder.toString();
    }

    private Map<String, Object> normalizeQuote(String code, JsonNode payload, Map<String, Object> fallbackStock) {
        String fallbackName = String.valueOf(fallbackStock.getOrDefault("name", code));
        String fallbackSymbol = String.valueOf(fallbackStock.getOrDefault("symbol", code));
        double fallbackPrice = parseDouble(fallbackStock.get("price"), 0D);

        double price = firstFiniteNumber(payload,
                "price", "lastPrice", "now", "current", "newprice", "trade", "zxj", "close");
        if (!Double.isFinite(price)) {
            price = fallbackPrice;
        }

        double open = firstFiniteNumber(payload, "open", "jrkp", "todayOpen");
        if (!Double.isFinite(open)) {
            open = price;
        }

        double high = firstFiniteNumber(payload, "high", "zgj", "todayHigh");
        if (!Double.isFinite(high)) {
            high = Math.max(price, open);
        }

        double low = firstFiniteNumber(payload, "low", "zdj", "todayLow");
        if (!Double.isFinite(low)) {
            low = Math.min(price, open);
        }

        double change = firstFiniteNumber(payload, "change", "priceChange", "zd", "zhangdie");
        if (!Double.isFinite(change)) {
            change = price - open;
        }

        double changePercent = firstFiniteNumber(
                payload,
                "changePercent", "changepercent", "changeRate", "pctChg", "zdf", "fd"
        );
        if (!Double.isFinite(changePercent) && Math.abs(open) > 1e-6) {
            changePercent = (change / open) * 100;
        }

        String volume = firstText(payload, "volume", "cjl", "dealVolume", "turnoverVolume");
        if (isBlank(volume)) {
            volume = "0";
        }

        String name = firstText(payload, "name", "stockName", "secName", "stockname", "mc");
        if (isBlank(name)) {
            name = fallbackName;
        }

        String symbol = firstText(payload, "symbol", "code", "dm", "gpdm");
        if (isBlank(symbol)) {
            symbol = fallbackSymbol;
        }

        Map<String, Object> quote = new LinkedHashMap<>();
        quote.put("symbol", normalizeDisplaySymbol(symbol, code));
        quote.put("name", name);
        quote.put("price", format(price));
        quote.put("change", format(change));
        quote.put("changePercent", format(changePercent));
        quote.put("open", format(open));
        quote.put("high", format(high));
        quote.put("low", format(low));
        quote.put("volume", volume);
        quote.put("pe", firstText(payload, "pe", "peRatio", "syl"));
        quote.put("pb", firstText(payload, "pb", "pbRatio", "sjl"));
        quote.put("roe", firstText(payload, "roe"));
        quote.put("revenueGrowth", firstText(payload, "revenueGrowth", "yysrzzl"));
        quote.put("orderBook", Map.of(
                "asks", fallbackOrderBook(price, 1),
                "bids", fallbackOrderBook(price, -1)
        ));

        fillIfBlank(quote, "pe", "18.3");
        fillIfBlank(quote, "pb", "2.1");
        fillIfBlank(quote, "roe", "11.5");
        fillIfBlank(quote, "revenueGrowth", "+15.2");
        return quote;
    }

    private Map<String, Object> normalizeRankRow(JsonNode raw, int index) {
        String symbolField = firstText(raw, "symbol", "gpdm", "sc");
        String code = extractCode(raw, symbolField, index);

        String name = firstText(raw, "name", "mc", "stockName", "secName", "stockname");
        if (isBlank(name)) {
            return null;
        }

        double price = firstFiniteNumber(raw,
                "price", "lastPrice", "now", "current", "p", "zxj", "close", "newprice");
        if (!Double.isFinite(price)) {
            price = 0D;
        }

        double change = firstFiniteNumber(raw, "change", "priceChange", "zd", "zhangdie");
        double changePercent = firstFiniteNumber(
                raw,
                "changeRate",
                "changePercent",
                "changepercent",
                "pctChg",
                "zdf",
                "zhangdief",
                "fd"
        );
        if (!Double.isFinite(changePercent) && Double.isFinite(change) && Math.abs(price - change) > 1e-6) {
            changePercent = (change / (price - change)) * 100;
        }
        if (!Double.isFinite(changePercent)) {
            changePercent = 0D;
        }

        Map<String, Object> row = new LinkedHashMap<>();
        row.put("code", code);
        row.put("symbol", formatListedSymbol(code, symbolField));
        row.put("name", name);
        row.put("price", format(price));
        row.put("change", formatSigned(change));
        row.put("changePercent", format(changePercent));
        return row;
    }

    private Map<String, Object> normalizeKLinePoint(JsonNode raw) {
        if (raw == null || raw.isNull() || raw.isMissingNode()) {
            return null;
        }

        String date = normalizeDate(firstText(raw, "date", "day", "time", "tradeDate", "d"));
        double open = firstFiniteNumber(raw, "open", "o", "kp");
        double close = firstFiniteNumber(raw, "close", "c", "sp", "zxj");
        double high = firstFiniteNumber(raw, "high", "h", "zgj");
        double low = firstFiniteNumber(raw, "low", "l", "zdj");
        long volume = Math.round(firstFiniteNumber(raw, "volume", "v", "cjl"));

        if (isBlank(date) || !Double.isFinite(open) || !Double.isFinite(close) || !Double.isFinite(high) || !Double.isFinite(low)) {
            return null;
        }

        Map<String, Object> point = new LinkedHashMap<>();
        point.put("date", date);
        point.put("open", format(open));
        point.put("close", format(close));
        point.put("high", format(high));
        point.put("low", format(low));
        point.put("volume", Math.max(volume, 0));
        return point;
    }

    private JsonNode extractList(JsonNode root) {
        if (root == null || root.isNull() || root.isMissingNode()) {
            return null;
        }
        if (root.isArray()) {
            return root;
        }

        JsonNode current = root;
        List<String> keys = List.of("data", "result", "body", "content");
        for (int depth = 0; depth < 5 && current != null; depth++) {
            JsonNode listNode = current.get("list");
            if (listNode != null && listNode.isArray()) {
                return listNode;
            }

            JsonNode dataNode = current.get("data");
            if (dataNode != null && dataNode.isArray()) {
                return dataNode;
            }

            JsonNode next = null;
            for (String key : keys) {
                JsonNode candidate = current.get(key);
                if (candidate != null && !candidate.isNull() && !candidate.isMissingNode()) {
                    if (candidate.isArray()) {
                        return candidate;
                    }
                    next = candidate;
                    break;
                }
            }

            current = next;
        }

        return current != null && current.isArray() ? current : null;
    }

    private JsonNode unwrapPayload(JsonNode root) {
        if (root == null || root.isMissingNode() || root.isNull()) {
            return root;
        }
        if (root.isArray()) {
            return root.isEmpty() ? root : root.get(0);
        }

        List<String> preferredKeys = List.of("data", "result", "body", "content", "list");
        JsonNode current = root;

        for (int depth = 0; depth < 4; depth++) {
            JsonNode next = null;
            for (String key : preferredKeys) {
                JsonNode candidate = current.get(key);
                if (candidate != null && !candidate.isNull() && !candidate.isMissingNode()) {
                    next = candidate;
                    break;
                }
            }

            if (next == null) {
                break;
            }

            current = next;
            if (current.isArray()) {
                return current.isEmpty() ? current : current.get(0);
            }
        }

        if (current.isObject() && current.size() == 1) {
            JsonNode onlyChild = current.fields().next().getValue();
            if (onlyChild != null && onlyChild.isObject()) {
                return onlyChild;
            }
        }

        return current;
    }

    private String extractCode(JsonNode raw, String symbolField, int index) {
        String digitsFromSymbol = extractSixDigits(symbolField);
        String normalizedCode = firstText(raw, "dm", "code").replaceAll("\\D", "");
        String code = digitsFromSymbol;

        if (isBlank(code) && normalizedCode.length() >= 6) {
            code = normalizedCode.substring(normalizedCode.length() - 6);
        }
        if (isBlank(code)) {
            code = "__" + index;
        }
        return code;
    }

    private String extractSixDigits(String value) {
        if (isBlank(value)) {
            return "";
        }
        java.util.regex.Matcher matcher = java.util.regex.Pattern.compile("(\\d{6})").matcher(value);
        return matcher.find() ? matcher.group(1) : "";
    }

    private String toProviderSymbol(String code) {
        String normalized = code == null ? "" : code.trim();
        if (normalized.isEmpty()) {
            return normalized;
        }
        if (normalized.contains(".")) {
            String[] parts = normalized.split("\\.");
            if (parts.length == 2) {
                return parts[1].toLowerCase(Locale.ROOT) + parts[0];
            }
        }
        if (normalized.startsWith("sh") || normalized.startsWith("sz") || normalized.startsWith("bj")) {
            return normalized.toLowerCase(Locale.ROOT);
        }
        if (normalized.length() == 6) {
            String prefix = normalized.substring(0, 3);
            if (prefix.startsWith("8") || prefix.startsWith("4")) {
                return "bj" + normalized;
            }
            if (List.of("000", "001", "002", "003", "300", "301").contains(prefix)) {
                return "sz" + normalized;
            }
            return "sh" + normalized;
        }
        return normalized.toLowerCase(Locale.ROOT);
    }

    private String formatListedSymbol(String code, String hint) {
        String normalizedHint = hint == null ? "" : hint.trim();
        if (normalizedHint.matches("(?i).+\\.(SH|SZ|BJ)$")) {
            return normalizedHint.toUpperCase(Locale.ROOT);
        }
        if (code.matches("\\d{6}")) {
            return code + "." + marketSuffixFromCode(code);
        }
        return normalizedHint.isBlank() ? code : normalizedHint;
    }

    private String normalizeDisplaySymbol(String symbol, String code) {
        if (isBlank(symbol)) {
            return code;
        }
        String normalized = symbol.trim().toLowerCase(Locale.ROOT);
        if (normalized.matches("(sh|sz|bj)\\d{6}")) {
            return normalized.substring(2) + "." + normalized.substring(0, 2).toUpperCase(Locale.ROOT);
        }
        return symbol;
    }

    private String marketSuffixFromCode(String code) {
        if (!code.matches("\\d{6}")) {
            return "SH";
        }
        String prefix = code.substring(0, 3);
        if (List.of("000", "001", "002", "003", "300", "301").contains(prefix)) {
            return "SZ";
        }
        if (prefix.startsWith("8") || prefix.startsWith("4")) {
            return "BJ";
        }
        return "SH";
    }

    private double firstFiniteNumber(JsonNode node, String... keys) {
        for (String key : keys) {
            JsonNode valueNode = node.get(key);
            if (valueNode == null || valueNode.isNull()) {
                continue;
            }
            double parsed = parseDouble(valueNode.asText(), Double.NaN);
            if (Double.isFinite(parsed)) {
                return parsed;
            }
        }
        return Double.NaN;
    }

    private String firstText(JsonNode node, String... keys) {
        for (String key : keys) {
            JsonNode valueNode = node.get(key);
            if (valueNode == null || valueNode.isNull()) {
                continue;
            }
            String value = valueNode.asText("");
            if (!isBlank(value)) {
                return normalizeRemoteText(value.trim());
            }
        }
        return "";
    }

    private List<Map<String, Object>> fallbackOrderBook(double price, int direction) {
        return java.util.stream.IntStream.rangeClosed(1, 5)
                .mapToObj(level -> {
                    Map<String, Object> entry = new LinkedHashMap<>();
                    entry.put("level", direction > 0 ? "ask" + level : "bid" + level);
                    entry.put("price", format(price + direction * level * 0.3));
                    entry.put("volume", 1000 + level * 500);
                    return entry;
                })
                .toList();
    }

    private void fillIfBlank(Map<String, Object> map, String key, String fallback) {
        Object value = map.get(key);
        if (value == null || String.valueOf(value).isBlank()) {
            map.put(key, fallback);
        }
    }

    private double parseDouble(Object value, double fallback) {
        if (value == null) {
            return fallback;
        }
        try {
            String text = String.valueOf(value).replace(",", "").replace("%", "").trim();
            if (text.isEmpty()) {
                return fallback;
            }
            return Double.parseDouble(text);
        } catch (NumberFormatException ex) {
            return fallback;
        }
    }

    private String normalizeDate(String value) {
        if (isBlank(value)) {
            return "";
        }
        String normalized = value.trim();
        if (normalized.length() >= 10) {
            return normalized.substring(0, 10);
        }
        return normalized;
    }

    private String format(double value) {
        return String.format(Locale.US, "%.2f", value);
    }

    private String formatSigned(double value) {
        String formatted = format(value);
        return value > 0 ? "+" + formatted : formatted;
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (!isBlank(value)) {
                return value;
            }
        }
        return "";
    }

    private String normalizeRemoteText(String value) {
        if (isBlank(value) || containsCjk(value)) {
            return value;
        }

        String utf8 = decodeAs(value, StandardCharsets.ISO_8859_1, StandardCharsets.UTF_8);
        if (containsCjk(utf8)) {
            return utf8;
        }

        String gbk = decodeAs(value, StandardCharsets.ISO_8859_1, Charset.forName("GBK"));
        if (containsCjk(gbk)) {
            return gbk;
        }

        return value;
    }

    private String decodeAs(String value, Charset sourceCharset, Charset targetCharset) {
        return new String(value.getBytes(sourceCharset), targetCharset);
    }

    private boolean containsCjk(String value) {
        return value.codePoints().anyMatch(codePoint ->
                Character.UnicodeScript.of(codePoint) == Character.UnicodeScript.HAN
        );
    }
}
