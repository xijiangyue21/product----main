package com.stockpulse.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.stockpulse.backend.entity.AiAdviceRecordEntity;
import com.stockpulse.backend.repository.AiAdviceRecordRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class MarketServiceTest {

    @Mock
    private AliyunMarketApiService aliyunMarketApiService;

    @Mock
    private SinaMarketApiService sinaMarketApiService;

    @Mock
    private AlphaVantageMarketApiService alphaVantageMarketApiService;

    @Mock
    private BailianAiService bailianAiService;

    @Mock
    private AiAdviceRecordRepository aiAdviceRecordRepository;

    private MarketService marketService;

    @BeforeEach
    void setUp() {
        marketService = new MarketService(
                new MarketMockService(aliyunMarketApiService, sinaMarketApiService),
                aliyunMarketApiService,
                sinaMarketApiService,
                alphaVantageMarketApiService,
                bailianAiService,
                aiAdviceRecordRepository,
                new EntityResponseMapper()
        );
    }

    @Test
    void quoteUsesAshareProviderForAshareCodes() {
        Map<String, Object> liveQuote = Map.of(
                "symbol", "600745.SH",
                "name", "闻泰科技",
                "price", "27.50",
                "changePercent", "-1.20"
        );
        when(aliyunMarketApiService.fetchAshareQuote(anyString(), anyMap())).thenReturn(Optional.of(liveQuote));

        Map<String, Object> quote = marketService.quote("600745");

        assertThat(quote).containsEntry("price", "27.50");
        verify(alphaVantageMarketApiService, never()).fetchQuote(anyString());
    }

    @Test
    void quoteFallsBackQuicklyForUnknownAshareCodes() {
        when(aliyunMarketApiService.fetchAshareQuote(anyString(), anyMap())).thenReturn(Optional.empty());
        when(sinaMarketApiService.fetchAshareQuote(anyString(), anyMap())).thenReturn(Optional.empty());

        Map<String, Object> quote = marketService.quote("600745");

        assertThat(quote)
                .containsEntry("symbol", "600745")
                .containsEntry("name", "600745")
                .containsEntry("source", "mock");
        verify(alphaVantageMarketApiService, never()).fetchQuote(anyString());
    }

    @Test
    void quoteFallsBackToSinaRealtimeBeforeMock() {
        Map<String, Object> sinaQuote = Map.of(
                "symbol", "600519.SH",
                "name", "贵州茅台",
                "price", "1384.79",
                "source", "sina"
        );
        when(aliyunMarketApiService.fetchAshareQuote(anyString(), anyMap())).thenReturn(Optional.empty());
        when(sinaMarketApiService.fetchAshareQuote(anyString(), anyMap())).thenReturn(Optional.of(sinaQuote));

        Map<String, Object> quote = marketService.quote("600519");

        assertThat(quote)
                .containsEntry("price", "1384.79")
                .containsEntry("source", "sina");
        verify(alphaVantageMarketApiService, never()).fetchQuote(anyString());
    }

    @Test
    void searchUsesAshareProviderForCodeQueries() {
        Map<String, Object> searchItem = Map.of(
                "code", "600745",
                "symbol", "600745.SH",
                "name", "闂绘嘲绉戞妧",
                "price", "28.00",
                "changePercent", "1.20"
        );
        when(aliyunMarketApiService.fetchAshareSearchItem(anyString(), anyMap())).thenReturn(Optional.of(searchItem));
        when(aliyunMarketApiService.normalizeCode(anyString())).thenAnswer(invocation -> invocation.getArgument(0));

        List<Map<String, Object>> rows = marketService.search("600745");

        assertThat(rows).hasSize(1);
        assertThat(rows.get(0))
                .containsEntry("code", "600745")
                .containsEntry("source", "live");
        verify(alphaVantageMarketApiService, never()).search(anyString(), anyInt());
    }

    @Test
    void partialAshareSearchUsesCatalogWithoutRealtimeFanout() {
        List<Map<String, Object>> rows = marketService.search("600");

        assertThat(rows).isNotEmpty();
        assertThat(rows.get(0)).containsEntry("source", "catalog");
        verify(aliyunMarketApiService, never()).fetchAshareSearchItem(anyString(), anyMap());
        verify(alphaVantageMarketApiService, never()).search(anyString(), anyInt());
    }

    @Test
    void aiSpeculationSavesRecordForLoggedInUser() {
        when(sinaMarketApiService.fetchAshareQuote(anyString(), anyMap())).thenReturn(Optional.empty());
        when(aliyunMarketApiService.fetchKLine(anyString())).thenReturn(Optional.empty());
        when(bailianAiService.speculationAdvice(anyMap())).thenReturn(Optional.empty());
        when(aiAdviceRecordRepository.save(any(AiAdviceRecordEntity.class))).thenAnswer(invocation -> {
            AiAdviceRecordEntity entity = invocation.getArgument(0);
            entity.setId("record-1");
            entity.setCreatedAt(LocalDateTime.of(2026, 5, 5, 12, 0));
            return entity;
        });

        Map<String, Object> result = marketService.aiSpeculation("user-1", "600519");

        ArgumentCaptor<AiAdviceRecordEntity> recordCaptor = ArgumentCaptor.forClass(AiAdviceRecordEntity.class);
        verify(aiAdviceRecordRepository).save(recordCaptor.capture());
        AiAdviceRecordEntity savedRecord = recordCaptor.getValue();
        assertThat(savedRecord.getUserId()).isEqualTo("user-1");
        assertThat(savedRecord.getCode()).isEqualTo("600519");
        assertThat(savedRecord.getStockName()).isEqualTo("贵州茅台");
        assertThat(savedRecord.getAdvice()).isNotBlank();
        assertThat(result.get("record")).isInstanceOf(Map.class);
    }

    @Test
    void aiAdviceRecordsReturnsCurrentUserRecords() {
        AiAdviceRecordEntity entity = new AiAdviceRecordEntity();
        entity.setId("record-1");
        entity.setUserId("user-1");
        entity.setCode("600519");
        entity.setSymbol("600519.SH");
        entity.setStockName("贵州茅台");
        entity.setSource("local");
        entity.setAdvice("测试建议");
        entity.setConfigStatus("未配置或未连通百炼，已使用本地规则");
        entity.setDisclaimer("仅用于学习和风险提示，不构成投资建议。");
        entity.setCreatedAt(LocalDateTime.of(2026, 5, 5, 12, 0));
        when(aiAdviceRecordRepository.findTop20ByUserIdOrderByCreatedAtDesc("user-1")).thenReturn(List.of(entity));

        List<Map<String, Object>> records = marketService.aiAdviceRecords("user-1");

        assertThat(records).hasSize(1);
        assertThat(records.get(0))
                .containsEntry("id", "record-1")
                .containsEntry("userId", "user-1")
                .containsEntry("stockName", "贵州茅台")
                .containsEntry("advice", "测试建议");
    }
}
