package com.stockpulse.backend.service;

import com.stockpulse.backend.entity.AiAdviceRecordEntity;
import com.stockpulse.backend.repository.AiAdviceRecordRepository;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class MarketService {

    private static final int RECENT_ANALYSIS_TRADING_DAYS = 60;
    private static final String RECENT_ANALYSIS_PERIOD = "近期60个交易日";

    private final MarketMockService marketMockService;
    private final AliyunMarketApiService aliyunMarketApiService;
    private final SinaMarketApiService sinaMarketApiService;
    private final AlphaVantageMarketApiService alphaVantageMarketApiService;
    private final BailianAiService bailianAiService;
    private final AiAdviceRecordRepository aiAdviceRecordRepository;
    private final EntityResponseMapper mapper;

    public MarketService(
            MarketMockService marketMockService,
            AliyunMarketApiService aliyunMarketApiService,
            SinaMarketApiService sinaMarketApiService,
            AlphaVantageMarketApiService alphaVantageMarketApiService,
            BailianAiService bailianAiService,
            AiAdviceRecordRepository aiAdviceRecordRepository,
            EntityResponseMapper mapper
    ) {
        this.marketMockService = marketMockService;
        this.aliyunMarketApiService = aliyunMarketApiService;
        this.sinaMarketApiService = sinaMarketApiService;
        this.alphaVantageMarketApiService = alphaVantageMarketApiService;
        this.bailianAiService = bailianAiService;
        this.aiAdviceRecordRepository = aiAdviceRecordRepository;
        this.mapper = mapper;
    }

    public List<Map<String, Object>> indices() {
        return sinaMarketApiService.fetchIndices()
                .map(liveRows -> mergeByCode(liveRows, marketMockService.indices()))
                .orElseGet(marketMockService::indices);
    }

    public Map<String, Object> quote(String code) {
        if (isAshareCode(code)) {
            return marketMockService.quote(code);
        }
        return alphaVantageMarketApiService.fetchQuote(code)
                .orElseGet(() -> marketMockService.quote(code));
    }

    public Map<String, Object> liveQuote(String code) {
        return fetchLiveQuote(code).orElseGet(() -> unavailableQuote(code));
    }

    public List<Map<String, Object>> stocks() {
        return aliyunMarketApiService.fetchRankedStocks(100)
                .map(liveRows -> mergeByCode(liveRows, marketMockService.stockCatalog()))
                .or(() -> sinaMarketApiService.fetchAshareQuotes(marketMockService.stockCatalog(), 100)
                        .map(liveRows -> mergeByCode(liveRows, marketMockService.stockCatalog())))
                .orElseGet(marketMockService::stockCatalog);
    }

    public List<Map<String, Object>> search(String query) {
        if (isAshareSearchQuery(query)) {
            return marketMockService.searchStocks(query);
        }

        return alphaVantageMarketApiService.search(query, 8)
                .map(alphaRows -> mergeByCode(marketMockService.searchStocks(query), alphaRows))
                .orElseGet(() -> marketMockService.searchStocks(query));
    }

    public List<Map<String, Object>> sectors() {
        return marketMockService.sectors();
    }

    public List<Map<String, Object>> news(String category) {
        return marketMockService.news(category);
    }

    public Map<String, Object> fundamentals(String code) {
        return marketMockService.fundamentals(code);
    }

    public List<Map<String, Object>> kLine(String code) {
        SourcedResult<List<Map<String, Object>>> liveResult = fetchMarketKLine(code);
        return liveResult.data().isEmpty() ? marketMockService.kLine(code) : liveResult.data();
    }

    public Map<String, Object> historyAnalysis(String code) {
        Map<String, Object> quote = liveQuote(code);
        SourcedResult<List<Map<String, Object>>> points = recentKLine(code);
        Map<String, Object> analysis = analyzeKLine(points.data(), RECENT_ANALYSIS_PERIOD);
        String asOfDate = String.valueOf(analysis.getOrDefault("endDate", quote.getOrDefault("tradeDate", "")));
        if (asOfDate.isBlank() || "--".equals(asOfDate)) {
            asOfDate = "--";
        }

        analysis.put("asOfDate", asOfDate);
        analysis.put("analysisWindow", "recent");
        analysis.put("historyDataSource", points.source());
        analysis.put("mockDataUsed", false);
        analysis.put("code", code);
        analysis.put("symbol", quote.getOrDefault("symbol", code));
        analysis.put("name", quote.getOrDefault("name", quote.getOrDefault("symbol", code)));
        analysis.put("currentPrice", quote.getOrDefault("price", "--"));
        analysis.put("currentChangePercent", quote.getOrDefault("changePercent", "--"));
        analysis.put("disclaimer", "仅用于学习和风险提示，不构成投资建议。");
        return analysis;
    }

    public Map<String, Object> aiContext(String code) {
        Map<String, Object> quote = liveQuote(code);
        Map<String, Object> history = historyAnalysis(code);

        Map<String, Object> context = new LinkedHashMap<>();
        context.put("asOfDate", history.getOrDefault("asOfDate", "--"));
        context.put("analysisWindow", history.getOrDefault("analysisWindow", "recent"));
        context.put("mockDataUsed", false);
        context.put("code", code);
        context.put("symbol", bestSymbol(code, quote.get("symbol"), history.get("symbol")));
        context.put("name", bestName(code, quote.get("name"), history.get("name")));
        context.put("latestPrice", quote.getOrDefault("price", history.getOrDefault("currentPrice", "--")));
        context.put("change", quote.getOrDefault("change", "--"));
        context.put("changePercent", quote.getOrDefault("changePercent", history.getOrDefault("currentChangePercent", "--")));
        context.put("open", quote.getOrDefault("open", "--"));
        context.put("dayHigh", quote.getOrDefault("high", "--"));
        context.put("dayLow", quote.getOrDefault("low", "--"));
        context.put("volume", quote.getOrDefault("volume", "--"));
        context.put("pe", firstNonBlankValue(quote.get("pe"), "--"));
        context.put("pb", firstNonBlankValue(quote.get("pb"), "--"));
        context.put("roe", firstNonBlankValue(quote.get("roe"), "--"));
        context.put("revenueGrowth", firstNonBlankValue(quote.get("revenueGrowth"), "--"));
        context.put("historyPeriod", history.getOrDefault("period", RECENT_ANALYSIS_PERIOD));
        context.put("historyStartDate", history.getOrDefault("startDate", "--"));
        context.put("historyEndDate", history.getOrDefault("endDate", "--"));
        context.put("historyDays", history.getOrDefault("days", 0));
        context.put("historyReturnPercent", history.getOrDefault("returnPercent", "--"));
        context.put("rangeHigh", history.getOrDefault("high", "--"));
        context.put("rangeHighDate", history.getOrDefault("highDate", "--"));
        context.put("rangeLow", history.getOrDefault("low", "--"));
        context.put("rangeLowDate", history.getOrDefault("lowDate", "--"));
        context.put("maxDrawdownPercent", history.getOrDefault("maxDrawdownPercent", "--"));
        context.put("avgVolume", history.getOrDefault("avgVolume", "--"));
        context.put("historyDataSource", history.getOrDefault("historyDataSource", "unavailable"));
        context.put("upDays", history.getOrDefault("upDays", 0));
        context.put("downDays", history.getOrDefault("downDays", 0));
        context.put("trendRating", history.getOrDefault("trend", "数据不足"));
        context.put("riskLevel", history.getOrDefault("riskLevel", "未知"));
        context.put("historySummary", history.getOrDefault("summary", ""));
        context.put("dataSources", Map.of(
                "quote", quote.getOrDefault("source", "unavailable"),
                "history", history.getOrDefault("historyDataSource", "unavailable"),
                "fundamentals", "unavailable"
        ));
        context.put("disclaimer", "仅用于学习和风险提示，不构成投资建议。");
        return context;
    }

    public Map<String, Object> aiSpeculation(String userId, String code) {
        Map<String, Object> analysis = historyAnalysis(code);
        Optional<String> bailianAdvice = bailianAiService.speculationAdvice(analysis);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("code", analysis.get("code"));
        result.put("symbol", analysis.get("symbol"));
        result.put("name", analysis.get("name"));
        result.put("source", bailianAdvice.isPresent() ? "bailian" : "local");
        result.put("advice", bailianAdvice.orElseGet(() -> localSpeculationAdvice(analysis)));
        result.put("configStatus", bailianAdvice.isPresent() ? "百炼模型已接入" : "未配置或未连通百炼，已使用本地规则");
        result.put("disclaimer", "仅用于学习和风险提示，不构成投资建议。");
        result.put("record", mapper.aiAdviceRecord(saveAiAdviceRecord(userId, result)));
        return result;
    }

    public List<Map<String, Object>> aiAdviceRecords(String userId) {
        return aiAdviceRecordRepository.findTop20ByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(mapper::aiAdviceRecord)
                .toList();
    }

    private AiAdviceRecordEntity saveAiAdviceRecord(String userId, Map<String, Object> advice) {
        AiAdviceRecordEntity entity = new AiAdviceRecordEntity();
        entity.setUserId(userId);
        entity.setCode(String.valueOf(advice.getOrDefault("code", "")));
        entity.setSymbol(String.valueOf(advice.getOrDefault("symbol", entity.getCode())));
        entity.setStockName(String.valueOf(advice.getOrDefault("name", entity.getSymbol())));
        entity.setSource(String.valueOf(advice.getOrDefault("source", "local")));
        entity.setAdvice(String.valueOf(advice.getOrDefault("advice", "")));
        entity.setConfigStatus(String.valueOf(advice.getOrDefault("configStatus", "")));
        entity.setDisclaimer(String.valueOf(advice.getOrDefault("disclaimer", "")));
        return aiAdviceRecordRepository.save(entity);
    }

    public SourcedResult<List<Map<String, Object>>> stockRank() {
        return aliyunMarketApiService.fetchRankedStocks(10)
                .<SourcedResult<List<Map<String, Object>>>>map(data -> new SourcedResult<>(data.stream().limit(10).toList(), "live"))
                .or(() -> sinaMarketApiService.fetchAshareQuotes(marketMockService.stockCatalog(), 10)
                        .map(data -> new SourcedResult<>(topByChangePercent(data, 10), "sina")))
                .orElseGet(() -> new SourcedResult<>(marketMockService.stockRank(), "mock"));
    }

    private List<Map<String, Object>> mergeByCode(List<Map<String, Object>> primary, List<Map<String, Object>> secondary) {
        LinkedHashMap<String, Map<String, Object>> merged = new LinkedHashMap<>();
        appendAll(merged, primary);
        appendAll(merged, secondary);
        return new ArrayList<>(merged.values());
    }

    private List<Map<String, Object>> topByChangePercent(List<Map<String, Object>> rows, int limit) {
        return rows.stream()
                .sorted(Comparator.comparingDouble((Map<String, Object> row) ->
                        parseDouble(row.get("changePercent"), 0D)).reversed())
                .limit(limit)
                .toList();
    }

    private boolean isAshareCode(String code) {
        if (code == null) {
            return false;
        }
        String normalized = code.trim().toUpperCase(Locale.ROOT);
        return normalized.matches("\\d{6}")
                || normalized.matches("(SH|SZ|BJ)\\d{6}")
                || normalized.matches("\\d{6}\\.(SH|SZ|BJ)");
    }

    private boolean isAshareSearchQuery(String query) {
        if (query == null) {
            return false;
        }
        String normalized = query.trim().toUpperCase(Locale.ROOT);
        return normalized.matches("\\d{1,6}")
                || normalized.matches("(SH|SZ|BJ)\\d{1,6}")
                || normalized.matches("\\d{1,6}\\.(SH|SZ|BJ)");
    }

    private void appendAll(LinkedHashMap<String, Map<String, Object>> merged, List<Map<String, Object>> rows) {
        for (Map<String, Object> row : rows) {
            String code = String.valueOf(row.getOrDefault("code", ""));
            if (!code.isBlank()) {
                merged.putIfAbsent(code, row);
            }
        }
    }

    private Optional<Map<String, Object>> fetchLiveQuote(String code) {
        if (isAshareCode(code)) {
            return sinaMarketApiService.fetchAshareQuote(code, catalogStock(code));
        }

        return alphaVantageMarketApiService.fetchQuote(code);
    }

    private Map<String, Object> unavailableQuote(String code) {
        Map<String, Object> stock = catalogStock(code);
        Map<String, Object> quote = new LinkedHashMap<>();
        quote.put("code", stock.getOrDefault("code", code));
        quote.put("symbol", stock.getOrDefault("symbol", code));
        quote.put("name", stock.getOrDefault("name", stock.getOrDefault("symbol", code)));
        quote.put("price", "--");
        quote.put("change", "--");
        quote.put("changePercent", "--");
        quote.put("open", "--");
        quote.put("high", "--");
        quote.put("low", "--");
        quote.put("volume", "--");
        quote.put("pe", "--");
        quote.put("pb", "--");
        quote.put("roe", "--");
        quote.put("revenueGrowth", "--");
        quote.put("source", "unavailable");
        return quote;
    }

    private Map<String, Object> catalogStock(String code) {
        String normalizedCode = normalizeAshareCode(code);
        return marketMockService.stockCatalog().stream()
                .filter(item -> normalizedCode.equals(item.get("code")))
                .findFirst()
                .map(item -> {
                    Map<String, Object> copy = new LinkedHashMap<>();
                    copy.put("code", item.get("code"));
                    copy.put("symbol", item.get("symbol"));
                    copy.put("name", item.get("name"));
                    return copy;
                })
                .orElseGet(() -> {
                    Map<String, Object> stock = new LinkedHashMap<>();
                    stock.put("code", normalizedCode.isBlank() ? String.valueOf(code) : normalizedCode);
                    stock.put("symbol", normalizedCode.isBlank() ? String.valueOf(code) : normalizedCode);
                    stock.put("name", normalizedCode.isBlank() ? String.valueOf(code) : normalizedCode);
                    return stock;
                });
    }

    private String normalizeAshareCode(String code) {
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
        String digits = normalized.replaceAll("\\D", "");
        return digits.length() >= 6 ? digits.substring(0, 6) : digits;
    }

    private Object firstNonBlankValue(Object... values) {
        for (Object value : values) {
            if (value == null) {
                continue;
            }
            String text = String.valueOf(value);
            if (!text.isBlank()) {
                return value;
            }
        }
        return "--";
    }

    private String bestSymbol(String code, Object... values) {
        String fallback = code;
        for (Object value : values) {
            if (value == null) {
                continue;
            }
            String text = String.valueOf(value).trim();
            if (text.contains(".")) {
                return text;
            }
            if (!text.isBlank() && !text.equalsIgnoreCase(code)) {
                fallback = text;
            }
        }
        return fallback;
    }

    private String bestName(String code, Object... values) {
        for (Object value : values) {
            if (value == null) {
                continue;
            }
            String text = String.valueOf(value).trim();
            if (!text.isBlank() && !text.equalsIgnoreCase(code)) {
                return text;
            }
        }
        return code;
    }

    private SourcedResult<List<Map<String, Object>>> fetchMarketKLine(String code) {
        if (isAshareCode(code)) {
            return sinaMarketApiService.fetchDailyKLine(code, 366)
                    .map(points -> new SourcedResult<>(points, "sina"))
                    .or(() -> aliyunMarketApiService.fetchKLine(code)
                            .map(points -> new SourcedResult<>(points, "live")))
                    .orElseGet(() -> new SourcedResult<>(List.of(), "unavailable"));
        }

        return alphaVantageMarketApiService.fetchDaily(code)
                .map(points -> new SourcedResult<>(points, "alpha_vantage"))
                .orElseGet(() -> new SourcedResult<>(List.of(), "unavailable"));
    }

    private SourcedResult<List<Map<String, Object>>> recentKLine(String code) {
        SourcedResult<List<Map<String, Object>>> rawResult = fetchMarketKLine(code);
        List<Map<String, Object>> sortedPoints = rawResult.data().stream()
                .filter(point -> parseDate(point.get("date")).isPresent())
                .sorted(Comparator.comparing(point -> parseDate(point.get("date")).orElse(LocalDate.MIN)))
                .toList();
        if (sortedPoints.isEmpty()) {
            return new SourcedResult<>(List.of(), rawResult.source());
        }

        int fromIndex = Math.max(sortedPoints.size() - RECENT_ANALYSIS_TRADING_DAYS, 0);
        return new SourcedResult<>(sortedPoints.subList(fromIndex, sortedPoints.size()), rawResult.source());
    }

    private Map<String, Object> analyzeKLine(List<Map<String, Object>> points, String periodLabel) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("period", periodLabel);
        result.put("days", points.size());

        if (points.isEmpty()) {
            result.put("summary", "暂无可用历史行情数据。");
            result.put("trend", "数据不足");
            result.put("riskLevel", "未知");
            result.put("source", "empty");
            return result;
        }

        Map<String, Object> firstPoint = points.get(0);
        Map<String, Object> lastPoint = points.get(points.size() - 1);
        double startClose = parseDouble(firstPoint.get("close"), Double.NaN);
        double endClose = parseDouble(lastPoint.get("close"), Double.NaN);

        double high = Double.NEGATIVE_INFINITY;
        double low = Double.POSITIVE_INFINITY;
        String highDate = "";
        String lowDate = "";
        double peak = Double.isFinite(startClose) ? startClose : 0D;
        double maxDrawdown = 0D;
        double totalVolume = 0D;
        int volumeDays = 0;
        int upDays = 0;
        int downDays = 0;
        double previousClose = Double.NaN;

        for (Map<String, Object> point : points) {
            double close = parseDouble(point.get("close"), Double.NaN);
            double pointHigh = parseDouble(point.get("high"), close);
            double pointLow = parseDouble(point.get("low"), close);
            double volume = parseDouble(point.get("volume"), Double.NaN);
            String date = String.valueOf(point.getOrDefault("date", ""));

            if (Double.isFinite(pointHigh) && pointHigh > high) {
                high = pointHigh;
                highDate = date;
            }
            if (Double.isFinite(pointLow) && pointLow < low) {
                low = pointLow;
                lowDate = date;
            }
            if (Double.isFinite(close)) {
                if (Double.isFinite(previousClose)) {
                    if (close >= previousClose) {
                        upDays++;
                    } else {
                        downDays++;
                    }
                }
                if (close > peak) {
                    peak = close;
                }
                if (peak > 0) {
                    maxDrawdown = Math.max(maxDrawdown, (peak - close) / peak * 100);
                }
                previousClose = close;
            }
            if (Double.isFinite(volume)) {
                totalVolume += volume;
                volumeDays++;
            }
        }

        double returnPercent = (Double.isFinite(startClose) && Math.abs(startClose) > 1e-6)
                ? (endClose - startClose) / startClose * 100
                : 0D;

        String startDate = String.valueOf(firstPoint.getOrDefault("date", ""));
        String endDate = String.valueOf(lastPoint.getOrDefault("date", ""));
        String trend = trendLabel(returnPercent, maxDrawdown);
        String riskLevel = riskLevel(maxDrawdown, returnPercent);

        result.put("startDate", startDate);
        result.put("endDate", endDate);
        result.put("startClose", format(startClose));
        result.put("endClose", format(endClose));
        result.put("returnPercent", format(returnPercent));
        result.put("high", format(high));
        result.put("highDate", highDate);
        result.put("low", format(low));
        result.put("lowDate", lowDate);
        result.put("maxDrawdownPercent", format(maxDrawdown));
        result.put("avgVolume", volumeDays == 0 ? "--" : formatVolume(totalVolume / volumeDays));
        result.put("upDays", upDays);
        result.put("downDays", downDays);
        result.put("trend", trend);
        result.put("riskLevel", riskLevel);
        result.put("summary", buildSummary(periodLabel, points.size(), startClose, endClose, returnPercent, high, low, maxDrawdown, trend, riskLevel));
        result.put("source", points.size() >= RECENT_ANALYSIS_TRADING_DAYS ? "computed" : "limited-data");
        return result;
    }

    private String buildSummary(
            String periodLabel,
            int days,
            double startClose,
            double endClose,
            double returnPercent,
            double high,
            double low,
            double maxDrawdown,
            String trend,
            String riskLevel
    ) {
        String direction = returnPercent >= 0 ? "上涨" : "下跌";
        return periodLabel + "样本 " + days + " 条，收盘价从 " + format(startClose)
                + " 到 " + format(endClose) + "，累计" + direction + " "
                + format(Math.abs(returnPercent)) + "%。区间高点 " + format(high)
                + "，低点 " + format(low) + "，最大回撤 " + format(maxDrawdown)
                + "%，趋势判断为" + trend + "，风险等级" + riskLevel + "。";
    }

    private String localSpeculationAdvice(Map<String, Object> analysis) {
        double returnPercent = parseDouble(analysis.get("returnPercent"), 0D);
        double maxDrawdown = parseDouble(analysis.get("maxDrawdownPercent"), 0D);
        String trend = String.valueOf(analysis.getOrDefault("trend", "数据不足"));
        String risk = String.valueOf(analysis.getOrDefault("riskLevel", "未知"));
        String high = String.valueOf(analysis.getOrDefault("high", "--"));
        String low = String.valueOf(analysis.getOrDefault("low", "--"));

        if (returnPercent > 12 && maxDrawdown < 25) {
            return "短线偏强，但不适合追高满仓。可把区间高点 " + high
                    + " 作为压力观察位，回撤不破近期均衡区再考虑轻仓试错；跌破 " + low
                    + " 附近应优先控制风险。风险等级：" + risk + "。";
        }
        if (returnPercent < -12 || maxDrawdown > 30) {
            return "近一年走势偏弱或波动较大，短线参与应以防守为先。若不能快速收复关键区间，不建议放大仓位；关注 "
                    + low + " 附近是否继续破位。趋势：" + trend + "，风险等级：" + risk + "。";
        }
        return "近一年呈震荡状态，适合等待放量突破或回踩确认后再小仓位试错。上方关注 "
                + high + " 压力，下方关注 " + low + " 支撑，单笔风险应提前限定。风险等级：" + risk + "。";
    }

    private String trendLabel(double returnPercent, double maxDrawdown) {
        if (returnPercent >= 15 && maxDrawdown <= 25) {
            return "震荡上行";
        }
        if (returnPercent >= 5) {
            return "偏强震荡";
        }
        if (returnPercent <= -15) {
            return "弱势下行";
        }
        return "区间震荡";
    }

    private String riskLevel(double maxDrawdown, double returnPercent) {
        if (maxDrawdown >= 35 || returnPercent <= -25) {
            return "高";
        }
        if (maxDrawdown >= 18 || Math.abs(returnPercent) >= 20) {
            return "中";
        }
        return "低";
    }

    private Optional<LocalDate> parseDate(Object value) {
        if (value == null) {
            return Optional.empty();
        }
        String text = String.valueOf(value).trim();
        if (text.length() > 10) {
            text = text.substring(0, 10);
        }
        try {
            return Optional.of(LocalDate.parse(text));
        } catch (DateTimeParseException ex) {
            return Optional.empty();
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

    private String format(double value) {
        if (!Double.isFinite(value)) {
            return "--";
        }
        return String.format(Locale.US, "%.2f", value);
    }

    private String formatVolume(double value) {
        if (!Double.isFinite(value)) {
            return "--";
        }
        if (value >= 100_000_000) {
            return String.format(Locale.US, "%.2f亿", value / 100_000_000);
        }
        if (value >= 10_000) {
            return String.format(Locale.US, "%.2f万", value / 10_000);
        }
        return String.format(Locale.US, "%.0f", value);
    }

    public record SourcedResult<T>(T data, String source) {}
}
