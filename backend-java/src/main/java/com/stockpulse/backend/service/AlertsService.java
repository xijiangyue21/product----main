package com.stockpulse.backend.service;

import com.stockpulse.backend.entity.AlertEntity;
import com.stockpulse.backend.entity.AlertHistoryEntity;
import com.stockpulse.backend.entity.PortfolioHoldingEntity;
import com.stockpulse.backend.exception.ApiException;
import com.stockpulse.backend.repository.AlertHistoryRepository;
import com.stockpulse.backend.repository.AlertRepository;
import com.stockpulse.backend.repository.PortfolioHoldingRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class AlertsService {

    private final AlertRepository alertRepository;
    private final AlertHistoryRepository alertHistoryRepository;
    private final PortfolioHoldingRepository portfolioHoldingRepository;
    private final MarketService marketService;
    private final EntityResponseMapper mapper;
    private final RequestValidationService validationService;

    public AlertsService(
            AlertRepository alertRepository,
            AlertHistoryRepository alertHistoryRepository,
            PortfolioHoldingRepository portfolioHoldingRepository,
            MarketService marketService,
            EntityResponseMapper mapper,
            RequestValidationService validationService
    ) {
        this.alertRepository = alertRepository;
        this.alertHistoryRepository = alertHistoryRepository;
        this.portfolioHoldingRepository = portfolioHoldingRepository;
        this.marketService = marketService;
        this.mapper = mapper;
        this.validationService = validationService;
    }

    public List<Map<String, Object>> list(String userId) {
        check(userId);
        return alertRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(mapper::alert)
                .toList();
    }

    public Map<String, Object> create(
            String userId,
            String symbol,
            String stockName,
            String conditionType,
            String conditionValue,
            Boolean notifyApp,
            Boolean notifySms,
            Boolean notifyWechat
    ) {
        AlertEntity entity = new AlertEntity();
        entity.setUserId(userId);
        entity.setSymbol(validationService.requireNonBlank(symbol, "Symbol is required"));
        entity.setStockName(validationService.requireNonBlank(stockName, "Stock name is required"));
        entity.setConditionType(validationService.validateAlertConditionType(conditionType));
        entity.setConditionValue(validationService.parseRequiredDecimal(conditionValue, "Condition value"));
        entity.setNotifyApp(notifyApp == null || notifyApp);
        entity.setNotifySms(Boolean.TRUE.equals(notifySms));
        entity.setNotifyWechat(Boolean.TRUE.equals(notifyWechat));

        AlertEntity saved = alertRepository.save(entity);
        evaluate(saved);
        return mapper.alert(saved);
    }

    public Map<String, Object> update(
            String userId,
            String id,
            String symbol,
            String stockName,
            String conditionType,
            String conditionValue,
            Boolean notifyApp,
            Boolean notifySms,
            Boolean notifyWechat,
            String status
    ) {
        AlertEntity entity = alertRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Alert not found"));

        String validatedSymbol = validationService.requireNonBlankIfProvided(symbol, "Symbol is required");
        String validatedStockName = validationService.requireNonBlankIfProvided(stockName, "Stock name is required");

        if (validatedSymbol != null) {
            entity.setSymbol(validatedSymbol);
        }
        if (validatedStockName != null) {
            entity.setStockName(validatedStockName);
        }
        if (conditionType != null) {
            entity.setConditionType(validationService.validateAlertConditionType(conditionType));
        }
        if (conditionValue != null) {
            entity.setConditionValue(validationService.parseRequiredDecimal(conditionValue, "Condition value"));
        }
        if (notifyApp != null) {
            entity.setNotifyApp(notifyApp);
        }
        if (notifySms != null) {
            entity.setNotifySms(notifySms);
        }
        if (notifyWechat != null) {
            entity.setNotifyWechat(notifyWechat);
        }
        if (status != null) {
            entity.setStatus(validationService.validateAlertStatus(status));
        }

        AlertEntity saved = alertRepository.save(entity);
        evaluate(saved);
        return mapper.alert(saved);
    }

    public void delete(String userId, String id) {
        AlertEntity entity = alertRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Alert not found"));
        alertRepository.delete(entity);
    }

    public List<Map<String, Object>> history(String userId) {
        return alertHistoryRepository.findTop50ByUserIdOrderByTriggeredAtDesc(userId).stream()
                .map(mapper::alertHistory)
                .toList();
    }

    public List<Map<String, Object>> check(String userId) {
        return evaluate(alertRepository.findByUserIdAndStatusOrderByCreatedAtDesc(userId, "active")).stream()
                .map(mapper::alertHistory)
                .toList();
    }

    public void checkAllActiveAlerts() {
        evaluate(alertRepository.findByStatus("active"));
    }

    private List<AlertHistoryEntity> evaluate(List<AlertEntity> alerts) {
        List<AlertHistoryEntity> histories = new ArrayList<>();
        for (AlertEntity alert : alerts) {
            evaluate(alert).ifPresent(histories::add);
        }
        return histories;
    }

    private Optional<AlertHistoryEntity> evaluate(AlertEntity alert) {
        if (!"active".equals(alert.getStatus())) {
            return Optional.empty();
        }

        Optional<BigDecimal> price = alert.getConditionType().startsWith("price")
                ? latestPrice(alert)
                : latestQuoteValue(alert.getSymbol(), "price");
        Optional<BigDecimal> changePercent = alert.getConditionType().startsWith("change")
                ? latestChangePercent(alert)
                : Optional.empty();
        if (!isTriggered(alert, price, changePercent)) {
            return Optional.empty();
        }

        LocalDateTime now = LocalDateTime.now();
        alert.setStatus("triggered");
        alert.setTriggerCount(alert.getTriggerCount() == null ? 1 : alert.getTriggerCount() + 1);
        alert.setLastTriggeredAt(now);
        alertRepository.save(alert);

        AlertHistoryEntity history = new AlertHistoryEntity();
        history.setAlertId(alert.getId());
        history.setUserId(alert.getUserId());
        history.setSymbol(alert.getSymbol());
        history.setStockName(alert.getStockName());
        history.setTriggerPrice(price.orElse(BigDecimal.ZERO));
        history.setConditionType(alert.getConditionType());
        history.setConditionValue(alert.getConditionValue());
        history.setTriggeredAt(now);
        return Optional.of(alertHistoryRepository.save(history));
    }

    private boolean isTriggered(
            AlertEntity alert,
            Optional<BigDecimal> price,
            Optional<BigDecimal> changePercent
    ) {
        BigDecimal conditionValue = alert.getConditionValue();
        return switch (alert.getConditionType()) {
            case "price_above" -> price.map(value -> value.compareTo(conditionValue) >= 0).orElse(false);
            case "price_below" -> price.map(value -> value.compareTo(conditionValue) <= 0).orElse(false);
            case "change_above" -> changePercent.map(value -> value.compareTo(conditionValue) >= 0).orElse(false);
            case "change_below" -> changePercent
                    .map(value -> value.compareTo(conditionValue.abs().negate()) <= 0)
                    .orElse(false);
            default -> false;
        };
    }

    private Optional<BigDecimal> latestPrice(AlertEntity alert) {
        Optional<BigDecimal> quotePrice = latestQuoteValue(alert.getSymbol(), "price");
        if (quotePrice.isPresent()) {
            return quotePrice;
        }
        return portfolioHoldingRepository.findByUserIdOrderByCreatedAtDesc(alert.getUserId()).stream()
                .filter(holding -> sameSymbol(holding.getSymbol(), alert.getSymbol()))
                .map(PortfolioHoldingEntity::getCurrentPrice)
                .filter(value -> value != null && value.compareTo(BigDecimal.ZERO) > 0)
                .findFirst();
    }

    private Optional<BigDecimal> latestChangePercent(AlertEntity alert) {
        return latestQuoteValue(alert.getSymbol(), "changePercent");
    }

    private Optional<BigDecimal> latestQuoteValue(String symbol, String field) {
        try {
            return parseMarketDecimal(marketService.quote(symbol).get(field));
        } catch (RuntimeException ex) {
            return Optional.empty();
        }
    }

    private Optional<BigDecimal> parseMarketDecimal(Object value) {
        if (value == null) {
            return Optional.empty();
        }
        String text = String.valueOf(value)
                .replace(",", "")
                .replace("%", "")
                .replace("¥", "")
                .trim();
        if (text.isEmpty() || "--".equals(text)) {
            return Optional.empty();
        }
        try {
            return Optional.of(new BigDecimal(text));
        } catch (NumberFormatException ex) {
            return Optional.empty();
        }
    }

    private boolean sameSymbol(String left, String right) {
        if (left == null || right == null) {
            return false;
        }
        if (left.equalsIgnoreCase(right)) {
            return true;
        }
        return normalizedCode(left).equals(normalizedCode(right));
    }

    private String normalizedCode(String symbol) {
        String normalized = symbol.trim().toUpperCase();
        if (normalized.matches("\\d{6}\\.(SH|SZ|BJ)")) {
            return normalized.substring(0, 6);
        }
        if (normalized.matches("(SH|SZ|BJ)\\d{6}")) {
            return normalized.substring(2);
        }
        return normalized;
    }
}
