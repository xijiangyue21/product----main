package com.stockpulse.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.stockpulse.backend.entity.AlertEntity;
import com.stockpulse.backend.entity.AlertHistoryEntity;
import com.stockpulse.backend.entity.PortfolioHoldingEntity;
import com.stockpulse.backend.exception.ApiException;
import com.stockpulse.backend.repository.AlertHistoryRepository;
import com.stockpulse.backend.repository.AlertRepository;
import com.stockpulse.backend.repository.PortfolioHoldingRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

@ExtendWith(MockitoExtension.class)
class AlertsServiceTest {

    @Mock
    private AlertRepository alertRepository;

    @Mock
    private AlertHistoryRepository alertHistoryRepository;

    @Mock
    private PortfolioHoldingRepository portfolioHoldingRepository;

    @Mock
    private MarketService marketService;

    private AlertsService alertsService;

    @BeforeEach
    void setUp() {
        alertsService = new AlertsService(
                alertRepository,
                alertHistoryRepository,
                portfolioHoldingRepository,
                marketService,
                new EntityResponseMapper(),
                new RequestValidationService()
        );
    }

    @Test
    void checkTriggersActivePriceAlertFromLatestQuote() {
        AlertEntity alert = alert("alert-1", "user-1", "600745", "price_below", "28", "active");
        when(alertRepository.findByUserIdAndStatusOrderByCreatedAtDesc("user-1", "active")).thenReturn(List.of(alert));
        when(marketService.quote("600745")).thenReturn(Map.of("price", "27.50", "changePercent", "-1.20"));
        when(alertRepository.save(alert)).thenReturn(alert);
        when(alertHistoryRepository.save(any(AlertHistoryEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        List<Map<String, Object>> histories = alertsService.check("user-1");

        assertThat(histories).hasSize(1);
        assertThat(alert.getStatus()).isEqualTo("triggered");
        assertThat(alert.getTriggerCount()).isEqualTo(1);
        assertThat(alert.getLastTriggeredAt()).isNotNull();

        ArgumentCaptor<AlertHistoryEntity> historyCaptor = ArgumentCaptor.forClass(AlertHistoryEntity.class);
        verify(alertHistoryRepository).save(historyCaptor.capture());
        AlertHistoryEntity history = historyCaptor.getValue();
        assertThat(history.getAlertId()).isEqualTo("alert-1");
        assertThat(history.getUserId()).isEqualTo("user-1");
        assertThat(history.getTriggerPrice()).isEqualByComparingTo("27.50");
    }

    @Test
    void checkFallsBackToHoldingCurrentPriceWhenQuoteUnavailable() {
        AlertEntity alert = alert("alert-1", "user-1", "600745.SH", "price_below", "28", "active");
        PortfolioHoldingEntity holding = new PortfolioHoldingEntity();
        holding.setUserId("user-1");
        holding.setSymbol("600745");
        holding.setCurrentPrice(new BigDecimal("27.80"));

        when(alertRepository.findByUserIdAndStatusOrderByCreatedAtDesc("user-1", "active")).thenReturn(List.of(alert));
        when(marketService.quote("600745.SH")).thenThrow(new ApiException(HttpStatus.NOT_FOUND, "Stock not found"));
        when(portfolioHoldingRepository.findByUserIdOrderByCreatedAtDesc("user-1")).thenReturn(List.of(holding));
        when(alertRepository.save(alert)).thenReturn(alert);
        when(alertHistoryRepository.save(any(AlertHistoryEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        List<Map<String, Object>> histories = alertsService.check("user-1");

        assertThat(histories).hasSize(1);
        assertThat(alert.getStatus()).isEqualTo("triggered");
        verify(alertHistoryRepository).save(any(AlertHistoryEntity.class));
    }

    @Test
    void checkDoesNotTriggerPausedAlerts() {
        when(alertRepository.findByUserIdAndStatusOrderByCreatedAtDesc("user-1", "active")).thenReturn(List.of());

        List<Map<String, Object>> histories = alertsService.check("user-1");

        assertThat(histories).isEmpty();
        verify(marketService, never()).quote(anyString());
        verify(alertHistoryRepository, never()).save(any(AlertHistoryEntity.class));
    }

    @Test
    void deleteRemovesOwnedAlert() {
        AlertEntity alert = alert("alert-1", "user-1", "600745", "price_below", "28", "active");
        when(alertRepository.findByIdAndUserId("alert-1", "user-1")).thenReturn(Optional.of(alert));

        alertsService.delete("user-1", "alert-1");

        verify(alertRepository).delete(alert);
        verify(alertRepository, never()).deleteByIdAndUserId(anyString(), anyString());
    }

    @Test
    void deleteRejectsMissingAlert() {
        when(alertRepository.findByIdAndUserId("alert-1", "user-1")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> alertsService.delete("user-1", "alert-1"))
                .isInstanceOf(ApiException.class)
                .hasMessage("Alert not found")
                .extracting("status")
                .isEqualTo(HttpStatus.NOT_FOUND);

        verify(alertRepository, never()).deleteByIdAndUserId(anyString(), anyString());
    }

    private AlertEntity alert(
            String id,
            String userId,
            String symbol,
            String conditionType,
            String conditionValue,
            String status
    ) {
        AlertEntity alert = new AlertEntity();
        alert.setId(id);
        alert.setUserId(userId);
        alert.setSymbol(symbol);
        alert.setStockName(symbol);
        alert.setConditionType(conditionType);
        alert.setConditionValue(new BigDecimal(conditionValue));
        alert.setStatus(status);
        alert.setTriggerCount(0);
        alert.setNotifyApp(true);
        alert.setNotifySms(false);
        alert.setNotifyWechat(false);
        return alert;
    }
}
