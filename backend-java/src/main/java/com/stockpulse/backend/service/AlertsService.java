package com.stockpulse.backend.service;

import com.stockpulse.backend.entity.AlertEntity;
import com.stockpulse.backend.exception.ApiException;
import com.stockpulse.backend.repository.AlertHistoryRepository;
import com.stockpulse.backend.repository.AlertRepository;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class AlertsService {

    private final AlertRepository alertRepository;
    private final AlertHistoryRepository alertHistoryRepository;
    private final EntityResponseMapper mapper;
    private final RequestValidationService validationService;

    public AlertsService(
            AlertRepository alertRepository,
            AlertHistoryRepository alertHistoryRepository,
            EntityResponseMapper mapper,
            RequestValidationService validationService
    ) {
        this.alertRepository = alertRepository;
        this.alertHistoryRepository = alertHistoryRepository;
        this.mapper = mapper;
        this.validationService = validationService;
    }

    public List<Map<String, Object>> list(String userId) {
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
        return mapper.alert(alertRepository.save(entity));
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

        return mapper.alert(alertRepository.save(entity));
    }

    public void delete(String userId, String id) {
        if (!alertRepository.existsByIdAndUserId(id, userId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Alert not found");
        }
        alertRepository.deleteByIdAndUserId(id, userId);
    }

    public List<Map<String, Object>> history(String userId) {
        return alertHistoryRepository.findTop50ByUserIdOrderByTriggeredAtDesc(userId).stream()
                .map(mapper::alertHistory)
                .toList();
    }
}
