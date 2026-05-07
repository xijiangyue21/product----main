package com.stockpulse.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.net.URI;
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
import org.springframework.stereotype.Service;

@Service
public class SinaMarketApiService {

    private static final String QUOTE_URL = "https://hq.sinajs.cn/list=";
    private static final String KLINE_URL = "https://money.finance.sina.com.cn/quotes_service/api/json_v2.php/CN_MarketData.getKLineData";
    private static final Charset SINA_CHARSET = Charset.forName("GB18030");
    private static final Map<String, String> INDEX_CODES = Map.of(
            "s_sh000001", "SH000001",
            "s_sz399001", "SZ399001",
            "s_sz399006", "SZ399006",
            "s_sh000300", "SH000300"
    );

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public SinaMarketApiService() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(2))
                .build();
        this.objectMapper = new ObjectMapper();
    }

    public Optional<Map<String, Object>> fetchAshareQuote(String code, Map<String, Object> fallbackStock) {
        return request(List.of(toSinaSymbol(code)))
                .flatMap(body -> parseQuote(body, code, fallbackStock));
    }

    public Optional<Map<String, Object>> fetchAshareSearchItem(String code, Map<String, Object> fallbackStock) {
        return fetchAshareQuote(code, fallbackStock).map(quote -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("code", normalizeCode(code));
            item.put("symbol", quote.getOrDefault("symbol", fallbackStock.getOrDefault("symbol", code)));
            item.put("name", quote.getOrDefault("name", fallbackStock.getOrDefault("name", code)));
            item.put("price", quote.getOrDefault("price", fallbackStock.getOrDefault("price", "0.00")));
            item.put("changePercent", quote.getOrDefault("changePercent", fallbackStock.getOrDefault("changePercent", "0.00")));
            item.put("source", "sina");
            return item;
        });
    }

    public Optional<List<Map<String, Object>>> fetchAshareQuotes(List<Map<String, Object>> fallbackStocks, int limit) {
        List<Map<String, Object>> stocks = fallbackStocks.stream()
                .limit(limit)
                .toList();
        if (stocks.isEmpty()) {
            return Optional.empty();
        }

        List<String> symbols = stocks.stream()
                .map(stock -> toSinaSymbol(String.valueOf(stock.getOrDefault("code", stock.getOrDefault("symbol", "")))))
                .filter(symbol -> !symbol.isBlank())
                .distinct()
                .toList();
        if (symbols.isEmpty()) {
            return Optional.empty();
        }

        Optional<String> body = request(symbols);
        if (body.isEmpty()) {
            return Optional.empty();
        }

        List<Map<String, Object>> rows = new ArrayList<>();
        for (Map<String, Object> stock : stocks) {
            String code = String.valueOf(stock.getOrDefault("code", stock.getOrDefault("symbol", "")));
            parseQuote(body.get(), code, stock).ifPresent(rows::add);
        }

        return rows.isEmpty() ? Optional.empty() : Optional.of(rows);
    }

    public Optional<List<Map<String, Object>>> fetchIndices() {
        List<String> symbols = INDEX_CODES.keySet().stream().sorted().toList();
        Optional<String> body = request(symbols);
        if (body.isEmpty()) {
            return Optional.empty();
        }

        List<Map<String, Object>> rows = new ArrayList<>();
        for (String symbol : symbols) {
            parseIndex(body.get(), symbol).ifPresent(rows::add);
        }

        return rows.isEmpty() ? Optional.empty() : Optional.of(rows);
    }

    public Optional<List<Map<String, Object>>> fetchDailyKLine(String code, int days) {
        String normalizedCode = normalizeCode(code);
        if (normalizedCode.length() != 6) {
            return Optional.empty();
        }

        int limit = Math.max(1, Math.min(days, 1200));
        String url = KLINE_URL
                + "?symbol=" + toSinaSymbol(normalizedCode)
                + "&scale=240&ma=no&datalen=" + limit;

        try {
            HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                    .timeout(Duration.ofSeconds(5))
                    .header("Referer", "https://finance.sina.com.cn")
                    .header("User-Agent", "Mozilla/5.0")
                    .GET()
                    .build();
            HttpResponse<byte[]> response = httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                return Optional.empty();
            }

            JsonNode rows = objectMapper.readTree(new String(response.body(), StandardCharsets.UTF_8));
            if (!rows.isArray() || rows.isEmpty()) {
                return Optional.empty();
            }

            List<Map<String, Object>> points = new ArrayList<>();
            for (JsonNode row : rows) {
                Map<String, Object> point = normalizeKLinePoint(row);
                if (point != null) {
                    points.add(point);
                }
            }

            return points.isEmpty() ? Optional.empty() : Optional.of(points);
        } catch (IOException | InterruptedException | IllegalArgumentException ex) {
            if (ex instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            return Optional.empty();
        }
    }

    private Optional<String> request(List<String> symbols) {
        if (symbols.isEmpty()) {
            return Optional.empty();
        }

        try {
            HttpRequest request = HttpRequest.newBuilder(URI.create(QUOTE_URL + String.join(",", symbols)))
                    .timeout(Duration.ofSeconds(3))
                    .header("Referer", "https://finance.sina.com.cn")
                    .header("User-Agent", "Mozilla/5.0")
                    .GET()
                    .build();
            HttpResponse<byte[]> response = httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                return Optional.empty();
            }
            return Optional.of(new String(response.body(), SINA_CHARSET));
        } catch (IOException | InterruptedException | IllegalArgumentException ex) {
            if (ex instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            return Optional.empty();
        }
    }

    private Optional<Map<String, Object>> parseQuote(String body, String requestedCode, Map<String, Object> fallbackStock) {
        String sinaSymbol = toSinaSymbol(requestedCode);
        String row = extractRow(body, sinaSymbol);
        if (row.isBlank()) {
            return Optional.empty();
        }

        String[] parts = row.split(",", -1);
        if (parts.length < 32 || parts[0].isBlank()) {
            return Optional.empty();
        }

        String code = normalizeCode(requestedCode);
        double open = parseDouble(parts[1], 0D);
        double previousClose = parseDouble(parts[2], 0D);
        double price = parseDouble(parts[3], previousClose);
        double high = parseDouble(parts[4], price);
        double low = parseDouble(parts[5], price);
        long volume = Math.max(0L, Math.round(parseDouble(parts[8], 0D)));

        if (price <= 0D && previousClose > 0D) {
            price = previousClose;
        }
        if (open <= 0D) {
            open = price;
        }
        if (high <= 0D) {
            high = Math.max(price, open);
        }
        if (low <= 0D) {
            low = Math.min(price, open);
        }

        double change = price - previousClose;
        double changePercent = previousClose > 0D ? change / previousClose * 100D : 0D;

        Map<String, Object> quote = new LinkedHashMap<>();
        quote.put("code", code);
        quote.put("symbol", code + "." + marketSuffixFromCode(code));
        quote.put("name", parts[0].isBlank() ? fallbackStock.getOrDefault("name", code) : parts[0]);
        quote.put("price", format(price));
        quote.put("change", format(change));
        quote.put("changePercent", format(changePercent));
        quote.put("open", format(open));
        quote.put("high", format(high));
        quote.put("low", format(low));
        quote.put("volume", formatVolume(volume));
        quote.put("pe", "");
        quote.put("pb", "");
        quote.put("roe", "");
        quote.put("revenueGrowth", "");
        quote.put("source", "sina");
        quote.put("updatedAt", System.currentTimeMillis());
        quote.put("tradeDate", parts[30]);
        quote.put("tradeTime", parts[31]);
        quote.put("orderBook", Map.of("asks", List.of(), "bids", List.of()));
        return Optional.of(quote);
    }

    private Optional<Map<String, Object>> parseIndex(String body, String sinaSymbol) {
        String row = extractRow(body, sinaSymbol);
        if (row.isBlank()) {
            return Optional.empty();
        }

        String[] parts = row.split(",", -1);
        if (parts.length < 4 || parts[0].isBlank()) {
            return Optional.empty();
        }

        Map<String, Object> index = new LinkedHashMap<>();
        index.put("code", INDEX_CODES.getOrDefault(sinaSymbol, sinaSymbol));
        index.put("name", parts[0]);
        index.put("price", format(parseDouble(parts[1], 0D)));
        index.put("change", format(parseDouble(parts[2], 0D)));
        index.put("changePercent", format(parseDouble(parts[3], 0D)));
        index.put("source", "sina");
        index.put("updatedAt", System.currentTimeMillis());
        return Optional.of(index);
    }

    private Map<String, Object> normalizeKLinePoint(JsonNode row) {
        String date = text(row, "day");
        double open = parseDouble(text(row, "open"), Double.NaN);
        double high = parseDouble(text(row, "high"), Double.NaN);
        double low = parseDouble(text(row, "low"), Double.NaN);
        double close = parseDouble(text(row, "close"), Double.NaN);

        if (date.isBlank()
                || !Double.isFinite(open)
                || !Double.isFinite(high)
                || !Double.isFinite(low)
                || !Double.isFinite(close)) {
            return null;
        }

        Map<String, Object> point = new LinkedHashMap<>();
        point.put("date", date);
        point.put("open", format(open));
        point.put("high", format(high));
        point.put("low", format(low));
        point.put("close", format(close));
        point.put("volume", text(row, "volume"));
        return point;
    }

    private String extractRow(String body, String sinaSymbol) {
        String marker = "hq_str_" + sinaSymbol + "=\"";
        int start = body.indexOf(marker);
        if (start < 0) {
            return "";
        }
        int valueStart = start + marker.length();
        int valueEnd = body.indexOf("\"", valueStart);
        return valueEnd < 0 ? "" : body.substring(valueStart, valueEnd);
    }

    private String text(JsonNode node, String fieldName) {
        JsonNode value = node.path(fieldName);
        if (value.isMissingNode() || value.isNull()) {
            return "";
        }
        return value.asText("").trim();
    }

    private String toSinaSymbol(String code) {
        String normalized = normalizeCode(code);
        if (normalized.length() != 6) {
            return "";
        }
        return marketPrefixFromCode(normalized) + normalized;
    }

    private String normalizeCode(String code) {
        if (code == null) {
            return "";
        }
        String normalized = code.trim().toUpperCase(Locale.ROOT);
        if (normalized.matches("(SH|SZ|BJ)\\d{6}")) {
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

    private String marketPrefixFromCode(String code) {
        if (code.startsWith("0") || code.startsWith("2") || code.startsWith("3")) {
            return "sz";
        }
        if (code.startsWith("4") || code.startsWith("8") || code.startsWith("92")) {
            return "bj";
        }
        return "sh";
    }

    private String marketSuffixFromCode(String code) {
        return marketPrefixFromCode(code).toUpperCase(Locale.ROOT);
    }

    private double parseDouble(String value, double fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        try {
            return Double.parseDouble(value.replace(",", "").trim());
        } catch (NumberFormatException ex) {
            return fallback;
        }
    }

    private String format(double value) {
        if (!Double.isFinite(value)) {
            return "0.00";
        }
        return String.format(Locale.US, "%.2f", value);
    }

    private String formatVolume(long value) {
        if (value >= 100_000_000L) {
            return String.format(Locale.US, "%.2f\u4ebf", value / 100_000_000D);
        }
        if (value >= 10_000L) {
            return String.format(Locale.US, "%.2f\u4e07", value / 10_000D);
        }
        return String.valueOf(value);
    }
}
