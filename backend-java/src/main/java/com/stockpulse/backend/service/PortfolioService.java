package com.stockpulse.backend.service;

import com.stockpulse.backend.entity.PortfolioHoldingEntity;
import com.stockpulse.backend.exception.ApiException;
import com.stockpulse.backend.repository.PortfolioHoldingRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class PortfolioService {

    private final PortfolioHoldingRepository repository;
    private final EntityResponseMapper mapper;
    private final RequestValidationService validationService;

    public PortfolioService(
            PortfolioHoldingRepository repository,
            EntityResponseMapper mapper,
            RequestValidationService validationService
    ) {
        this.repository = repository;
        this.mapper = mapper;
        this.validationService = validationService;
    }

    public List<Map<String, Object>> list(String userId) {
        return repository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(mapper::holding)
                .toList();
    }

    public Map<String, Object> create(
            String userId,
            String symbol,
            String name,
            String shares,
            String costPrice,
            String currentPrice
    ) {
        PortfolioHoldingEntity entity = new PortfolioHoldingEntity();
        entity.setUserId(userId);
        entity.setSymbol(validationService.requireNonBlank(symbol, "Symbol is required"));
        entity.setName(validationService.requireNonBlank(name, "Name is required"));
        entity.setShares(validationService.parseRequiredDecimal(shares, "Shares"));
        entity.setCostPrice(validationService.parseRequiredDecimal(costPrice, "Cost price"));
        entity.setCurrentPrice(validationService.parseOptionalDecimalOrDefault(currentPrice, "Current price", BigDecimal.ZERO));
        return mapper.holding(repository.save(entity));
    }

    public Map<String, Object> update(String userId, String id, String shares, String costPrice, String currentPrice) {
        PortfolioHoldingEntity entity = repository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Holding not found"));

        if (shares != null) {
            entity.setShares(validationService.parseRequiredDecimal(shares, "Shares"));
        }
        if (costPrice != null) {
            entity.setCostPrice(validationService.parseRequiredDecimal(costPrice, "Cost price"));
        }
        if (currentPrice != null) {
            entity.setCurrentPrice(validationService.parseOptionalDecimalOrDefault(currentPrice, "Current price", BigDecimal.ZERO));
        }

        return mapper.holding(repository.save(entity));
    }

    public void delete(String userId, String id) {
        if (!repository.existsByIdAndUserId(id, userId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Holding not found");
        }
        repository.deleteByIdAndUserId(id, userId);
    }
}
