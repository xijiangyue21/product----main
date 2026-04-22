package com.stockpulse.backend.controller;

import com.stockpulse.backend.api.ApiResponse;
import com.stockpulse.backend.security.AuthenticatedUser;
import com.stockpulse.backend.service.WatchlistService;
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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/watchlist")
public class WatchlistController {

    private final WatchlistService watchlistService;

    public WatchlistController(WatchlistService watchlistService) {
        this.watchlistService = watchlistService;
    }

    @GetMapping("/groups")
    public ApiResponse<List<Map<String, Object>>> groups(@AuthenticationPrincipal AuthenticatedUser principal) {
        return ApiResponse.success(watchlistService.groups(principal.id()));
    }

    @PostMapping("/groups")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Map<String, Object>> createGroup(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @Valid @RequestBody GroupRequest request
    ) {
        return ApiResponse.success(watchlistService.createGroup(principal.id(), request.name()));
    }

    @DeleteMapping("/groups/{id}")
    public ApiResponse<Void> deleteGroup(@AuthenticationPrincipal AuthenticatedUser principal, @PathVariable String id) {
        watchlistService.deleteGroup(principal.id(), id);
        return ApiResponse.success(null);
    }

    @GetMapping("/groups/{groupId}/items")
    public ApiResponse<List<Map<String, Object>>> itemsByGroup(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable String groupId
    ) {
        return ApiResponse.success(watchlistService.itemsByGroup(principal.id(), groupId));
    }

    @GetMapping("/items")
    public ApiResponse<List<Map<String, Object>>> items(@AuthenticationPrincipal AuthenticatedUser principal) {
        return ApiResponse.success(watchlistService.items(principal.id()));
    }

    @PostMapping("/items")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Map<String, Object>> createItem(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @Valid @RequestBody ItemRequest request
    ) {
        return ApiResponse.success(
                watchlistService.createItem(principal.id(), request.groupId(), request.symbol(), request.name())
        );
    }

    @DeleteMapping("/items/{id}")
    public ApiResponse<Void> deleteItem(@AuthenticationPrincipal AuthenticatedUser principal, @PathVariable String id) {
        watchlistService.deleteItem(principal.id(), id);
        return ApiResponse.success(null);
    }

    public record GroupRequest(@NotBlank(message = "Group name is required") String name) {}

    public record ItemRequest(
            @NotBlank(message = "Group id is required") String groupId,
            @NotBlank(message = "Symbol is required") String symbol,
            @NotBlank(message = "Name is required") String name
    ) {}
}
