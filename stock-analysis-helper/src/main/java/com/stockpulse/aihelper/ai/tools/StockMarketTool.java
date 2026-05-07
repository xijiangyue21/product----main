package com.stockpulse.aihelper.ai.tools;

import dev.langchain4j.agent.tool.P;
import dev.langchain4j.agent.tool.Tool;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

/**
 * 股票行情工具，默认调用同仓库 StockPulse 后端的市场接口。
 */
@Slf4j
@Component
public class StockMarketTool {

    @Value("${stock.api.base-url:http://localhost:3000}")
    private String stockApiBaseUrl;

    @Value("${stock.api.token:}")
    private String stockApiToken;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    @Tool(name = "stockSearch", value = """
            Search A-share stocks by Chinese name, pinyin, symbol, or six-digit code.
            Use this tool first when the user gives a stock name but not a confirmed stock code.
            """)
    public String searchStock(@P(value = "stock name, pinyin, symbol, or six-digit code") String keyword) {
        String encodedKeyword = URLEncoder.encode(keyword, StandardCharsets.UTF_8);
        return get("/api/market/search?q=" + encodedKeyword);
    }

    @Tool(name = "stockQuote", value = """
            Get the latest quote for a stock code, including price, daily change, high, low, volume, PE, PB, and order book.
            Use this tool when the user asks about the current market state of a specific stock.
            The result uses live market sources only; unavailable fields are returned as unavailable instead of mock data.
            """)
    public String getStockQuote(@P(value = "six-digit stock code, for example 600519") String code) {
        return get("/api/market/live-quote/" + encodePath(code));
    }

    @Tool(name = "stockHistoryAnalysis", value = """
            Get recent live historical market analysis for a stock code, based on the latest available trading days.
            This replaces the old one-year/mock history path. Use it before giving short-term trend or risk analysis.
            """)
    public String getStockHistoryAnalysis(@P(value = "six-digit stock code, for example 600519") String code) {
        return get("/api/market/history-analysis/" + encodePath(code));
    }

    @Tool(name = "stockAnalysisContext", value = """
            Get the complete stock context for AI analysis in one call.
            The result includes latest price, change percent, volume,
            recent live range high/low, max drawdown, trend rating, risk level, and history summary.
            Do not treat the old one-year/mock history fields as valid if they appear in earlier conversations.
            The result uses live market sources only; unavailable fields are returned as unavailable instead of mock data.
            Always use this tool before producing a stock analysis for a confirmed stock code.
            """)
    public String getStockAnalysisContext(@P(value = "six-digit stock code, for example 600519") String code) {
        return get("/api/market/ai-context/" + encodePath(code));
    }

    private String get(String path) {
        String url = normalizeBaseUrl(stockApiBaseUrl) + path;
        try {
            HttpRequest.Builder requestBuilder = HttpRequest.newBuilder(URI.create(url))
                    .timeout(Duration.ofSeconds(12))
                    .GET();
            if (stockApiToken != null && !stockApiToken.isBlank()) {
                requestBuilder.header("Authorization", "Bearer " + stockApiToken.trim());
            }

            HttpResponse<String> response = httpClient.send(requestBuilder.build(), HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 401 || response.statusCode() == 403) {
                return "股票接口需要登录授权。请在环境变量 STOCK_API_TOKEN 中填写 StockPulse 后端 JWT 后重试。";
            }
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                return "股票接口请求失败，HTTP " + response.statusCode() + "，地址：" + url;
            }
            return response.body();
        } catch (IOException | InterruptedException | IllegalArgumentException ex) {
            if (ex instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            log.warn("stock api request failed: {}", url, ex);
            return "无法连接股票行情接口。请确认 StockPulse 后端已启动，并检查 STOCK_API_BASE_URL，当前地址：" + normalizeBaseUrl(stockApiBaseUrl);
        }
    }

    private String normalizeBaseUrl(String baseUrl) {
        String normalized = baseUrl == null || baseUrl.isBlank() ? "http://localhost:3000" : baseUrl.trim();
        while (normalized.endsWith("/")) {
            normalized = normalized.substring(0, normalized.length() - 1);
        }
        return normalized;
    }

    private String encodePath(String value) {
        return URLEncoder.encode(value == null ? "" : value.trim(), StandardCharsets.UTF_8);
    }
}
