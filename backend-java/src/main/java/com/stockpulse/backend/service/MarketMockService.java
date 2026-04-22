package com.stockpulse.backend.service;

import com.stockpulse.backend.exception.ApiException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ThreadLocalRandom;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class MarketMockService {

    private final AliyunMarketApiService aliyunMarketApiService;

    public MarketMockService(AliyunMarketApiService aliyunMarketApiService) {
        this.aliyunMarketApiService = aliyunMarketApiService;
    }

    public List<Map<String, Object>> indices() {
        return List.of(
                index("SH000001", "上证指数", 3287.45, 1.23),
                index("SZ399001", "深证成指", 10542.18, 0.87),
                index("SZ399006", "创业板指", 2156.33, -0.34),
                index("SH000300", "沪深300", 3891.72, 1.05),
                index("HK.HSI", "恒生指数", 19234.56, 2.14),
                index("NASDAQ", "纳斯达克", 17845.23, -0.56)
        );
    }

    public Map<String, Object> quote(String code) {
        Optional<Map<String, Object>> liveQuote = aliyunMarketApiService.fetchAshareQuote(code, fallbackStock(code));
        if (liveQuote.isPresent()) {
            return liveQuote.get();
        }

        return mockQuote(code);
    }

    private Map<String, Object> mockQuote(String code) {
        Map<String, Object> base = stockCatalog().stream()
                .filter(item -> code.equals(item.get("code")))
                .findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Stock not found"));
        double start = Double.parseDouble((String) base.get("price"));
        double open = start * 0.99;
        double current = start * (1 + random(-0.02, 0.03));
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("symbol", base.get("symbol"));
        map.put("name", base.get("name"));
        map.put("price", format(current));
        map.put("change", format(current - open));
        map.put("changePercent", format((current - open) / open * 100));
        map.put("open", format(open));
        map.put("high", format(current * 1.02));
        map.put("low", format(current * 0.98));
        map.put("volume", "12.6B");
        map.put("pe", "18.3");
        map.put("pb", "2.1");
        map.put("roe", "11.5");
        map.put("revenueGrowth", "+15.2");
        map.put("orderBook", Map.of(
                "asks", orderBook(current, 1),
                "bids", orderBook(current, -1)
        ));
        return map;
    }

    private Map<String, Object> fallbackStock(String code) {
        return stockCatalog().stream()
                .filter(item -> code.equals(item.get("code")))
                .findFirst()
                .orElseGet(() -> Map.of(
                        "code", code,
                        "symbol", code,
                        "name", code,
                        "price", "100.00"
                ));
    }

    public List<Map<String, Object>> stockCatalog() {
        return List.of(
                stock("600519", "600519.SH", "\u8d35\u5dde\u8305\u53f0", 1742.50),
                stock("300750", "300750.SZ", "\u5b81\u5fb7\u65f6\u4ee3", 195.60),
                stock("600036", "600036.SH", "\u62db\u5546\u94f6\u884c", 39.85),
                stock("002594", "002594.SZ", "\u6bd4\u4e9a\u8fea", 285.40),
                stock("688981", "688981.SH", "\u4e2d\u82af\u56fd\u9645", 62.18),
                stock("601012", "601012.SH", "\u9686\u57fa\u7eff\u80fd", 24.56),
                stock("300059", "300059.SZ", "\u4e1c\u65b9\u8d22\u5bcc", 18.92)
        );
    }

    public List<Map<String, Object>> searchStocks(String query) {
        if (query == null || query.isBlank()) {
            return List.of();
        }

        String normalized = query.trim().toLowerCase();
        List<Map<String, Object>> localMatches = stockCatalog().stream()
                .filter(item -> matchesQuery(item, normalized))
                .sorted(Comparator.comparingInt(item -> matchScore(item, normalized)))
                .limit(8)
                .map(item -> {
                    Map<String, Object> copy = new LinkedHashMap<>();
                    copy.putAll(item);
                    return copy;
                })
                .toList();

        if (localMatches.isEmpty() && looksLikeCodeQuery(normalized)) {
            return aliyunMarketApiService.fetchAshareSearchItem(normalized, unknownSearchFallback(normalized))
                    .map(List::of)
                    .orElse(List.of());
        }

        return localMatches.stream()
                .map(item -> enrichSearchItem(item))
                .toList();
    }

    public List<Map<String, Object>> sectors() {
        return List.of(
                sector("AI", "+4.82", 96),
                sector("Semiconductor", "+3.67", 73),
                sector("EV", "+2.91", 58),
                sector("Liquor", "+1.65", 33),
                sector("Biotech", "-0.43", 9),
                sector("Banking", "+0.92", 18)
        );
    }

    public List<Map<String, Object>> news(String category) {
        List<Map<String, Object>> news = List.of(
                newsItem("1", "major", "Major", "Market sentiment improves on growth rotation", "14:28", "600519"),
                newsItem("2", "industry", "Industry", "Chipmakers extend gains on demand optimism", "13:55", "688981"),
                newsItem("3", "announcement", "Announcement", "Battery leader expands strategic partnerships", "11:30", "300750"),
                newsItem("4", "macro", "Macro", "Liquidity support boosts risk appetite", "10:15", null)
        );
        if (category == null || category.isBlank() || "all".equalsIgnoreCase(category)) {
            return news;
        }
        return news.stream().filter(item -> category.equals(item.get("categoryType"))).toList();
    }

    public Map<String, Object> fundamentals(String code) {
        Map<String, Object> stock = stockCatalog().stream()
                .filter(item -> code.equals(item.get("code")))
                .findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Stock not found"));
        return Map.of(
                "symbol", stock.get("symbol"),
                "name", stock.get("name"),
                "pe", "18.3",
                "pb", "2.1",
                "roe", "11.5",
                "revenueGrowth", "+15.2",
                "events", List.of(
                        Map.of("date", "2026-03-10", "title", "Dividend plan announced", "type", "Dividend"),
                        Map.of("date", "2026-02-28", "title", "FY2025 earnings guidance", "type", "Earnings"),
                        Map.of("date", "2026-01-15", "title", "Investor roadshow update", "type", "Announcement")
                )
        );
    }

    public List<Map<String, Object>> kLine(String code) {
        double base = Double.parseDouble((String) stockCatalog().stream()
                .filter(item -> code.equals(item.get("code")))
                .findFirst()
                .orElse(Map.of("price", "100.00"))
                .get("price"));
        List<Map<String, Object>> points = new ArrayList<>();
        double price = base * 0.85;
        for (int i = 60; i >= 0; i--) {
            price = price * (1 + random(-0.015, 0.02));
            LocalDate date = LocalDate.now().minusDays(i);
            points.add(Map.of(
                    "date", date.toString(),
                    "open", format(price * 0.99),
                    "close", format(price),
                    "high", format(price * 1.015),
                    "low", format(price * 0.985),
                    "volume", ThreadLocalRandom.current().nextInt(10_000_000, 60_000_000)
            ));
        }
        return points;
    }

    public List<Map<String, Object>> stockRank() {
        return stockCatalog().stream()
                .limit(7)
                .map(item -> {
                    double pct = random(-2.5, 12.5);
                    double price = Double.parseDouble((String) item.get("price")) * (1 + pct / 100);
                    return Map.<String, Object>of(
                            "code", item.get("code"),
                            "symbol", item.get("symbol"),
                            "name", item.get("name"),
                            "price", format(price),
                            "change", format(price - Double.parseDouble((String) item.get("price"))),
                            "changePercent", format(pct)
                    );
                })
                .toList();
    }

    private Map<String, Object> index(String code, String name, double price, double pct) {
        return Map.of(
                "code", code,
                "name", name,
                "price", format(price * (1 + random(-0.004, 0.004))),
                "change", format(pct),
                "changePercent", format(pct)
        );
    }

    private Map<String, Object> stock(String code, String symbol, String name, double price) {
        return Map.of(
                "code", code,
                "symbol", symbol,
                "name", name,
                "price", format(price),
                "changePercent", format(random(-2.5, 6.5))
        );
    }

    private boolean matchesQuery(Map<String, Object> item, String query) {
        String code = String.valueOf(item.get("code")).toLowerCase();
        String symbol = String.valueOf(item.get("symbol")).toLowerCase();
        String name = String.valueOf(item.get("name")).toLowerCase();
        return code.contains(query) || symbol.contains(query) || name.contains(query);
    }

    private int matchScore(Map<String, Object> item, String query) {
        String code = String.valueOf(item.get("code")).toLowerCase();
        String symbol = String.valueOf(item.get("symbol")).toLowerCase();
        String name = String.valueOf(item.get("name")).toLowerCase();

        if (code.equals(query) || symbol.equals(query) || name.equals(query)) {
            return 0;
        }
        if (code.startsWith(query) || symbol.startsWith(query) || name.startsWith(query)) {
            return 1;
        }
        return 2;
    }

    private boolean looksLikeCodeQuery(String query) {
        return query.matches("\\d{6}")
                || query.matches("(sh|sz|bj)\\d{6}")
                || query.matches("\\d{6}\\.(sh|sz|bj)");
    }

    private Map<String, Object> enrichSearchItem(Map<String, Object> item) {
        String code = String.valueOf(item.get("code"));
        return aliyunMarketApiService.fetchAshareSearchItem(code, item)
                .orElse(item);
    }

    private Map<String, Object> unknownSearchFallback(String query) {
        String normalizedCode = aliyunMarketApiService.normalizeCode(query);
        String displaySymbol = normalizedCode.length() == 6 ? normalizedCode : query.toUpperCase();
        return Map.of(
                "code", normalizedCode.isBlank() ? query : normalizedCode,
                "symbol", displaySymbol,
                "name", query.toUpperCase(),
                "price", "0.00",
                "changePercent", "0.00"
        );
    }

    private Map<String, Object> sector(String name, String pct, int width) {
        return Map.of("name", name, "changePercent", pct, "width", width);
    }

    private Map<String, Object> newsItem(String id, String categoryType, String category, String title, String time, String symbol) {
        Map<String, Object> news = new LinkedHashMap<>();
        news.put("id", id);
        news.put("categoryType", categoryType);
        news.put("category", category);
        news.put("title", title);
        news.put("time", time);
        news.put("symbol", symbol);
        news.put("image", "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=120&h=80&fit=crop");
        return news;
    }

    private List<Map<String, Object>> orderBook(double current, int direction) {
        List<Map<String, Object>> list = new ArrayList<>();
        for (int i = 1; i <= 5; i++) {
            list.add(Map.of(
                    "level", direction > 0 ? "ask" + i : "bid" + i,
                    "price", format(current + direction * i * 0.5),
                    "volume", ThreadLocalRandom.current().nextInt(500, 5000)
            ));
        }
        return list;
    }

    private double random(double min, double max) {
        return ThreadLocalRandom.current().nextDouble(min, max);
    }

    private String format(double value) {
        return String.format(java.util.Locale.US, "%.2f", value);
    }
}
