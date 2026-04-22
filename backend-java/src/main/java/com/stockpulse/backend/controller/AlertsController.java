package com.stockpulse.backend.controller;

import com.stockpulse.backend.api.ApiResponse;
import com.stockpulse.backend.security.AuthenticatedUser;
import com.stockpulse.backend.service.AlertsService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/alerts")
public class AlertsController {

    private final AlertsService alertsService;

    public AlertsController(AlertsService alertsService) {
        this.alertsService = alertsService;
    }

    @GetMapping
    public ApiResponse<List<Map<String, Object>>> list(@AuthenticationPrincipal AuthenticatedUser principal) {
        return ApiResponse.success(alertsService.list(principal.id()));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Map<String, Object>> create(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @Valid @RequestBody AlertRequest request
    ) {
        return ApiResponse.success(
                alertsService.create(
                        principal.id(),
                        request.symbol(),
                        request.stockName(),
                        request.conditionType(),
                        request.conditionValue(),
                        request.notifyApp(),
                        request.notifySms(),
                        request.notifyWechat()
                )
        );
    }

    @PutMapping("/{id}")
    public ApiResponse<Map<String, Object>> update(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable String id,
            @RequestBody UpdateAlertRequest request
    ) {
        return ApiResponse.success(
                alertsService.update(
                        principal.id(),
                        id,
                        request.symbol(),
                        request.stockName(),
                        request.conditionType(),
                        request.conditionValue(),
                        request.notifyApp(),
                        request.notifySms(),
                        request.notifyWechat(),
                        request.status()
                )
        );
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@AuthenticationPrincipal AuthenticatedUser principal, @PathVariable String id) {
        alertsService.delete(principal.id(), id);
        return ApiResponse.success(null);
    }

    @GetMapping("/history")
    public ApiResponse<List<Map<String, Object>>> history(@AuthenticationPrincipal AuthenticatedUser principal) {
        return ApiResponse.success(alertsService.history(principal.id()));
    }

    public record AlertRequest(
            @NotBlank(message = "Symbol is required") String symbol,
            @NotBlank(message = "Stock name is required") String stockName,
            @NotBlank(message = "Condition type is required") String conditionType,
            @NotBlank(message = "Condition value is required") String conditionValue,
            Boolean notifyApp,
            Boolean notifySms,
            Boolean notifyWechat
    ) {}

    public record UpdateAlertRequest(
            String symbol,
            String stockName,
            String conditionType,
            String conditionValue,
            Boolean notifyApp,
            Boolean notifySms,
            Boolean notifyWechat,
            String status
    ) {}
}
