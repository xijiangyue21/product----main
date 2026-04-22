package com.stockpulse.backend.service;

import com.stockpulse.backend.exception.ApiException;
import java.math.BigDecimal;
import java.util.Locale;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class RequestValidationService {

    private static final Set<String> THEMES = Set.of("dark", "light");
    private static final Set<String> ALERT_CONDITION_TYPES = Set.of(
            "price_above",
            "price_below",
            "change_above",
            "change_below"
    );
    private static final Set<String> ALERT_STATUSES = Set.of("active", "paused", "triggered");

    public String validateTheme(String theme) {
        String normalized = normalizeOptionalValue(theme);
        if (normalized == null) {
            return null;
        }
        normalized = normalized.toLowerCase(Locale.ROOT);
        if (!THEMES.contains(normalized)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Theme must be one of: dark, light");
        }
        return normalized;
    }

    public String validateAlertConditionType(String conditionType) {
        String normalized = normalizeRequiredValue(conditionType, "Condition type is required");
        normalized = normalized.toLowerCase(Locale.ROOT);
        if (!ALERT_CONDITION_TYPES.contains(normalized)) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Condition type must be one of: price_above, price_below, change_above, change_below"
            );
        }
        return normalized;
    }

    public String validateAlertStatus(String status) {
        String normalized = normalizeOptionalValue(status);
        if (normalized == null) {
            return null;
        }
        normalized = normalized.toLowerCase(Locale.ROOT);
        if (!ALERT_STATUSES.contains(normalized)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Status must be one of: active, paused, triggered");
        }
        return normalized;
    }

    public String requireNonBlank(String value, String message) {
        return normalizeRequiredValue(value, message);
    }

    public String requireNonBlankIfProvided(String value, String message) {
        if (value == null) {
            return null;
        }
        return normalizeRequiredValue(value, message);
    }

    public BigDecimal parseRequiredDecimal(String value, String fieldName) {
        String normalized = normalizeRequiredValue(value, fieldName + " is required");
        return parseDecimal(normalized, fieldName);
    }

    public BigDecimal parseOptionalDecimal(String value, String fieldName) {
        String normalized = normalizeOptionalValue(value);
        if (normalized == null) {
            return null;
        }
        return parseDecimal(normalized, fieldName);
    }

    public BigDecimal parseOptionalDecimalOrDefault(String value, String fieldName, BigDecimal fallback) {
        String normalized = normalizeOptionalValue(value);
        if (normalized == null) {
            return fallback;
        }
        return parseDecimal(normalized, fieldName);
    }

    private BigDecimal parseDecimal(String value, String fieldName) {
        try {
            return new BigDecimal(value);
        } catch (NumberFormatException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, fieldName + " must be a valid number");
        }
    }

    private String normalizeRequiredValue(String value, String message) {
        String normalized = normalizeOptionalValue(value);
        if (normalized == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, message);
        }
        return normalized;
    }

    private String normalizeOptionalValue(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        if (normalized.isEmpty()) {
            return null;
        }
        return normalized.toLowerCase(Locale.ROOT).equals(value.trim()) ? normalized : normalized;
    }
}
