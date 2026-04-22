package com.stockpulse.backend.controller;

import com.stockpulse.backend.api.ApiResponse;
import com.stockpulse.backend.exception.ApiException;
import com.stockpulse.backend.security.AuthenticatedUser;
import com.stockpulse.backend.service.AuthService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/signup")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Map<String, Object>> signup(@Valid @RequestBody SignupRequest request) {
        if (!request.password().equals(request.confirmPassword())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Passwords do not match");
        }
        return ApiResponse.success(authService.signup(request.name(), request.email(), request.password()));
    }

    @PostMapping("/login")
    public ApiResponse<Map<String, Object>> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.success(authService.login(request.email(), request.password()));
    }

    @GetMapping("/me")
    public ApiResponse<Map<String, Object>> me(@AuthenticationPrincipal AuthenticatedUser principal) {
        return ApiResponse.success(authService.currentUser(principal.id()));
    }

    @PutMapping("/preferences")
    public ApiResponse<Map<String, Object>> updatePreferences(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @Valid @RequestBody UpdatePreferencesRequest request
    ) {
        return ApiResponse.success(
                authService.updatePreferences(principal.id(), request.theme(), request.refreshRate())
        );
    }

    public record SignupRequest(
            @NotBlank(message = "Name is required") String name,
            @NotBlank(message = "Please enter a valid email address") @Email(message = "Please enter a valid email address") String email,
            @NotBlank(message = "Password must be at least 6 characters") @Size(min = 6, message = "Password must be at least 6 characters") String password,
            @NotBlank(message = "Confirm password must be at least 6 characters") @Size(min = 6, message = "Confirm password must be at least 6 characters") String confirmPassword
    ) {}

    public record LoginRequest(
            @NotBlank(message = "Please enter a valid email address") @Email(message = "Please enter a valid email address") String email,
            @NotBlank(message = "Password must be at least 6 characters") @Size(min = 6, message = "Password must be at least 6 characters") String password
    ) {}

    public record UpdatePreferencesRequest(
            String theme,
            @Max(value = 60, message = "Refresh rate must be at most 60") Integer refreshRate
    ) {}
}
