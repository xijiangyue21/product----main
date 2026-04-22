package com.stockpulse.backend.controller;

import com.stockpulse.backend.api.ApiResponse;
import com.stockpulse.backend.service.MarketService;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/market")
public class MarketController {

    private final MarketService marketService;

    public MarketController(MarketService marketService) {
        this.marketService = marketService;
    }

    @GetMapping("/indices")
    public ApiResponse<List<Map<String, Object>>> indices() {
        return ApiResponse.success(marketService.indices());
    }

    @GetMapping("/quote/{code}")
    public ApiResponse<Map<String, Object>> quote(@PathVariable String code) {
        return ApiResponse.success(marketService.quote(code));
    }

    @GetMapping("/stocks")
    public ApiResponse<List<Map<String, Object>>> stocks() {
        return ApiResponse.success(marketService.stocks());
    }

    @GetMapping("/search")
    public ApiResponse<List<Map<String, Object>>> search(@RequestParam String q) {
        return ApiResponse.success(marketService.search(q));
    }

    @GetMapping("/sectors")
    public ApiResponse<List<Map<String, Object>>> sectors() {
        return ApiResponse.success(marketService.sectors());
    }

    @GetMapping("/news")
    public ApiResponse<List<Map<String, Object>>> news(@RequestParam(required = false) String category) {
        return ApiResponse.success(marketService.news(category));
    }

    @GetMapping("/fundamentals/{code}")
    public ApiResponse<Map<String, Object>> fundamentals(@PathVariable String code) {
        return ApiResponse.success(marketService.fundamentals(code));
    }

    @GetMapping("/kline/{code}")
    public ApiResponse<List<Map<String, Object>>> kline(@PathVariable String code) {
        return ApiResponse.success(marketService.kLine(code));
    }

    @GetMapping("/stock-rank")
    public ApiResponse<List<Map<String, Object>>> stockRank() {
        MarketService.SourcedResult<List<Map<String, Object>>> result = marketService.stockRank();
        return ApiResponse.success(result.data(), System.currentTimeMillis(), result.source());
    }
}
