package com.stockpulse.backend.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class MarketService {

    private final MarketMockService marketMockService;
    private final AliyunMarketApiService aliyunMarketApiService;

    public MarketService(MarketMockService marketMockService, AliyunMarketApiService aliyunMarketApiService) {
        this.marketMockService = marketMockService;
        this.aliyunMarketApiService = aliyunMarketApiService;
    }

    public List<Map<String, Object>> indices() {
        return aliyunMarketApiService.fetchRankedStocks(6)
                .map(rows -> rows.stream().limit(6).toList())
                .orElseGet(marketMockService::indices);
    }

    public Map<String, Object> quote(String code) {
        return marketMockService.quote(code);
    }

    public List<Map<String, Object>> stocks() {
        return aliyunMarketApiService.fetchRankedStocks(100)
                .map(liveRows -> mergeByCode(liveRows, marketMockService.stockCatalog()))
                .orElseGet(marketMockService::stockCatalog);
    }

    public List<Map<String, Object>> search(String query) {
        return marketMockService.searchStocks(query);
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
        return aliyunMarketApiService.fetchKLine(code).orElseGet(() -> marketMockService.kLine(code));
    }

    public SourcedResult<List<Map<String, Object>>> stockRank() {
        return aliyunMarketApiService.fetchRankedStocks(10)
                .<SourcedResult<List<Map<String, Object>>>>map(data -> new SourcedResult<>(data.stream().limit(10).toList(), "live"))
                .orElseGet(() -> new SourcedResult<>(marketMockService.stockRank(), "mock"));
    }

    private List<Map<String, Object>> mergeByCode(List<Map<String, Object>> primary, List<Map<String, Object>> secondary) {
        LinkedHashMap<String, Map<String, Object>> merged = new LinkedHashMap<>();
        appendAll(merged, primary);
        appendAll(merged, secondary);
        return new ArrayList<>(merged.values());
    }

    private void appendAll(LinkedHashMap<String, Map<String, Object>> merged, List<Map<String, Object>> rows) {
        for (Map<String, Object> row : rows) {
            String code = String.valueOf(row.getOrDefault("code", ""));
            if (!code.isBlank()) {
                merged.putIfAbsent(code, row);
            }
        }
    }

    public record SourcedResult<T>(T data, String source) {}
}
