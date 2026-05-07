package com.stockpulse.backend.service;

import com.stockpulse.backend.entity.AiAdviceRecordEntity;
import com.stockpulse.backend.entity.AlertEntity;
import com.stockpulse.backend.entity.AlertHistoryEntity;
import com.stockpulse.backend.entity.FeedbackEntity;
import com.stockpulse.backend.entity.PortfolioHoldingEntity;
import com.stockpulse.backend.entity.UploadEntity;
import com.stockpulse.backend.entity.UserEntity;
import com.stockpulse.backend.entity.WatchlistGroupEntity;
import com.stockpulse.backend.entity.WatchlistItemEntity;
import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class EntityResponseMapper {

    public Map<String, Object> user(UserEntity entity) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", entity.getId());
        map.put("email", entity.getEmail());
        map.put("name", entity.getName());
        map.put("theme", entity.getTheme());
        map.put("refreshRate", entity.getRefreshRate());
        map.put("createdAt", entity.getCreatedAt());
        map.put("updatedAt", entity.getUpdatedAt());
        return map;
    }

    public Map<String, Object> watchlistGroup(WatchlistGroupEntity entity) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", entity.getId());
        map.put("userId", entity.getUserId());
        map.put("name", entity.getName());
        map.put("createdAt", entity.getCreatedAt());
        map.put("updatedAt", entity.getUpdatedAt());
        return map;
    }

    public Map<String, Object> watchlistItem(WatchlistItemEntity entity) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", entity.getId());
        map.put("groupId", entity.getGroupId());
        map.put("userId", entity.getUserId());
        map.put("symbol", entity.getSymbol());
        map.put("name", entity.getName());
        map.put("createdAt", entity.getCreatedAt());
        return map;
    }

    public Map<String, Object> holding(PortfolioHoldingEntity entity) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", entity.getId());
        map.put("userId", entity.getUserId());
        map.put("symbol", entity.getSymbol());
        map.put("name", entity.getName());
        map.put("shares", decimal(entity.getShares()));
        map.put("costPrice", decimal(entity.getCostPrice()));
        map.put("currentPrice", decimal(entity.getCurrentPrice()));
        map.put("createdAt", entity.getCreatedAt());
        map.put("updatedAt", entity.getUpdatedAt());
        return map;
    }

    public Map<String, Object> alert(AlertEntity entity) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", entity.getId());
        map.put("userId", entity.getUserId());
        map.put("symbol", entity.getSymbol());
        map.put("stockName", entity.getStockName());
        map.put("conditionType", entity.getConditionType());
        map.put("conditionValue", decimal(entity.getConditionValue()));
        map.put("notifyApp", entity.getNotifyApp());
        map.put("notifySms", entity.getNotifySms());
        map.put("notifyWechat", entity.getNotifyWechat());
        map.put("status", entity.getStatus());
        map.put("triggerCount", entity.getTriggerCount());
        map.put("lastTriggeredAt", entity.getLastTriggeredAt());
        map.put("createdAt", entity.getCreatedAt());
        map.put("updatedAt", entity.getUpdatedAt());
        return map;
    }

    public Map<String, Object> alertHistory(AlertHistoryEntity entity) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", entity.getId());
        map.put("alertId", entity.getAlertId());
        map.put("userId", entity.getUserId());
        map.put("symbol", entity.getSymbol());
        map.put("stockName", entity.getStockName());
        map.put("triggerPrice", decimal(entity.getTriggerPrice()));
        map.put("conditionType", entity.getConditionType());
        map.put("conditionValue", decimal(entity.getConditionValue()));
        map.put("triggeredAt", entity.getTriggeredAt());
        return map;
    }

    public Map<String, Object> feedback(FeedbackEntity entity) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", entity.getId());
        map.put("userId", entity.getUserId());
        map.put("content", entity.getContent());
        map.put("createdAt", entity.getCreatedAt());
        return map;
    }

    public Map<String, Object> aiAdviceRecord(AiAdviceRecordEntity entity) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", entity.getId());
        map.put("userId", entity.getUserId());
        map.put("code", entity.getCode());
        map.put("symbol", entity.getSymbol());
        map.put("stockName", entity.getStockName());
        map.put("source", entity.getSource());
        map.put("advice", entity.getAdvice());
        map.put("configStatus", entity.getConfigStatus());
        map.put("disclaimer", entity.getDisclaimer());
        map.put("createdAt", entity.getCreatedAt());
        return map;
    }

    public Map<String, Object> upload(UploadEntity entity) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", entity.getId());
        map.put("fileName", entity.getFileName());
        map.put("fileSize", entity.getFileSize());
        map.put("fileType", entity.getFileType());
        map.put("s3Key", entity.getS3Key());
        map.put("s3Url", entity.getS3Url());
        map.put("uploadId", entity.getUploadId());
        map.put("status", entity.getStatus());
        map.put("createdAt", entity.getCreatedAt());
        map.put("updatedAt", entity.getUpdatedAt());
        return map;
    }

    private String decimal(BigDecimal value) {
        return value == null ? "0" : value.stripTrailingZeros().toPlainString();
    }
}
