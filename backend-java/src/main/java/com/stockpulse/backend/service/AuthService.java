package com.stockpulse.backend.service;

import com.stockpulse.backend.entity.UserEntity;
import com.stockpulse.backend.exception.ApiException;
import com.stockpulse.backend.repository.UserRepository;
import com.stockpulse.backend.security.JwtService;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EntityResponseMapper mapper;
    private final RequestValidationService validationService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            EntityResponseMapper mapper,
            RequestValidationService validationService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.mapper = mapper;
        this.validationService = validationService;
    }

    public Map<String, Object> signup(String name, String email, String password) {
        if (userRepository.findByEmail(email).isPresent()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "An account with this email already exists");
        }

        UserEntity user = new UserEntity();
        user.setName(name);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user = userRepository.save(user);

        return authPayload(user, "Signup successful");
    }

    public Map<String, Object> login(String email, String password) {
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        return authPayload(user, "Login successful");
    }

    public Map<String, Object> currentUser(String userId) {
        return mapper.user(requireUser(userId));
    }

    public Map<String, Object> updatePreferences(String userId, String theme, Integer refreshRate) {
        UserEntity user = requireUser(userId);
        String validatedTheme = validationService.validateTheme(theme);

        if (validatedTheme != null) {
            user.setTheme(validatedTheme);
        }
        if (refreshRate != null) {
            user.setRefreshRate(refreshRate);
        }

        return mapper.user(userRepository.save(user));
    }

    private Map<String, Object> authPayload(UserEntity user, String message) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("message", message);
        map.put("token", jwtService.generateToken(user.getId(), user.getEmail()));
        map.put("user", mapper.user(user));
        return map;
    }

    private UserEntity requireUser(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Unauthorized - please log in"));
    }
}
