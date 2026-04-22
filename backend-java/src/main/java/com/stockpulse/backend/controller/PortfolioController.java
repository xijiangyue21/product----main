package com.stockpulse.backend.controller;

import com.stockpulse.backend.api.ApiResponse;
import com.stockpulse.backend.security.AuthenticatedUser;
import com.stockpulse.backend.service.PortfolioService;
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
@RequestMapping("/api/portfolio")
public class PortfolioController {

    private final PortfolioService portfolioService;

    public PortfolioController(PortfolioService portfolioService) {
        this.portfolioService = portfolioService;
    }

    @GetMapping
    public ApiResponse<List<Map<String, Object>>> list(@AuthenticationPrincipal AuthenticatedUser principal) {
        return ApiResponse.success(portfolioService.list(principal.id()));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Map<String, Object>> create(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @Valid @RequestBody HoldingRequest request
    ) {
        return ApiResponse.success(
                portfolioService.create(
                        principal.id(),
                        request.symbol(),
                        request.name(),
                        request.shares(),
                        request.costPrice(),
                        request.currentPrice()
                )
        );
    }

    @PutMapping("/{id}")
    public ApiResponse<Map<String, Object>> update(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable String id,
            @RequestBody UpdateHoldingRequest request
    ) {
        return ApiResponse.success(
                portfolioService.update(
                        principal.id(),
                        id,
                        request.shares(),
                        request.costPrice(),
                        request.currentPrice()
                )
        );
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@AuthenticationPrincipal AuthenticatedUser principal, @PathVariable String id) {
        portfolioService.delete(principal.id(), id);
        return ApiResponse.success(null);
    }

    public record HoldingRequest(
            @NotBlank(message = "Symbol is required") String symbol,
            @NotBlank(message = "Name is required") String name,
            @NotBlank(message = "Shares is required") String shares,
            @NotBlank(message = "Cost price is required") String costPrice,
            String currentPrice
    ) {}

    public record UpdateHoldingRequest(String shares, String costPrice, String currentPrice) {}
}
