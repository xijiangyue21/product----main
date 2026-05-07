package com.stockpulse.backend.config;

import com.zaxxer.hikari.HikariDataSource;
import jakarta.annotation.PostConstruct;
import java.net.URI;
import java.net.URISyntaxException;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import javax.sql.DataSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

@Configuration
public class DatabaseConfig {

    private final Environment environment;

    public DatabaseConfig(Environment environment) {
        this.environment = environment;
    }

    @PostConstruct
    void validate() {
        if (environment.getProperty("DATABASE_URL") == null || environment.getProperty("DATABASE_URL").isBlank()) {
            throw new IllegalStateException("DATABASE_URL is required");
        }
    }

    @Bean
    DataSource dataSource() throws URISyntaxException {
        JdbcConnection connection = toJdbcConnection(environment.getProperty("DATABASE_URL").trim());

        HikariDataSource dataSource = new HikariDataSource();
        dataSource.setJdbcUrl(connection.jdbcUrl());
        if (!isBlank(connection.username())) {
            dataSource.setUsername(connection.username());
        }
        if (connection.password() != null) {
            dataSource.setPassword(connection.password());
        }
        dataSource.setMaximumPoolSize(readInt("DB_POOL_MAX_SIZE", 5));
        dataSource.setMinimumIdle(readInt("DB_POOL_MIN_IDLE", 1));
        dataSource.setConnectionTimeout(readLong("DB_POOL_CONNECTION_TIMEOUT_MS", 10_000L));
        dataSource.setValidationTimeout(readLong("DB_POOL_VALIDATION_TIMEOUT_MS", 5_000L));
        dataSource.setIdleTimeout(readLong("DB_POOL_IDLE_TIMEOUT_MS", 60_000L));
        dataSource.setKeepaliveTime(readLong("DB_POOL_KEEPALIVE_MS", 120_000L));
        dataSource.setMaxLifetime(readLong("DB_POOL_MAX_LIFETIME_MS", 240_000L));

        return dataSource;
    }

    private JdbcConnection toJdbcConnection(String databaseUrl) throws URISyntaxException {
        if (databaseUrl.startsWith("jdbc:mysql://")) {
            return new JdbcConnection(
                    withDefaultMysqlParameters(databaseUrl),
                    firstNonBlank("DB_USERNAME", "DB_USER"),
                    firstNonBlank("DB_PASSWORD", "DB_PASS")
            );
        }

        URI uri = new URI(databaseUrl);
        if (!"mysql".equalsIgnoreCase(uri.getScheme())) {
            throw new IllegalStateException(
                    "DATABASE_URL must be a MySQL URI, for example mysql://user:password@localhost:3306/stockpulse"
            );
        }
        if (isBlank(uri.getHost())) {
            throw new IllegalStateException("DATABASE_URL must include a MySQL host");
        }
        if (isBlank(uri.getPath()) || "/".equals(uri.getPath())) {
            throw new IllegalStateException("DATABASE_URL must include a MySQL database name");
        }

        StringBuilder jdbc = new StringBuilder("jdbc:mysql://")
                .append(uri.getHost())
                .append(':')
                .append(uri.getPort() == -1 ? 3306 : uri.getPort())
                .append(uri.getPath());
        if (!isBlank(uri.getRawQuery())) {
            jdbc.append('?').append(uri.getRawQuery());
        }

        String[] credentials = splitCredentials(uri.getRawUserInfo());
        return new JdbcConnection(
                withDefaultMysqlParameters(jdbc.toString()),
                credentials[0],
                credentials[1]
        );
    }

    private String withDefaultMysqlParameters(String jdbcUrl) {
        int queryIndex = jdbcUrl.indexOf('?');
        String baseUrl = queryIndex < 0 ? jdbcUrl : jdbcUrl.substring(0, queryIndex);
        String query = queryIndex < 0 ? "" : jdbcUrl.substring(queryIndex + 1);

        Set<String> existingKeys = new LinkedHashSet<>();
        if (!query.isBlank()) {
            for (String part : query.split("&")) {
                int equalsIndex = part.indexOf('=');
                String key = equalsIndex < 0 ? part : part.substring(0, equalsIndex);
                if (!key.isBlank()) {
                    existingKeys.add(key.toLowerCase(Locale.ROOT));
                }
            }
        }

        Map<String, String> defaults = new LinkedHashMap<>();
        defaults.put("useUnicode", "true");
        defaults.put("characterEncoding", "utf8");
        defaults.put("serverTimezone", "Asia/Shanghai");
        defaults.put("allowPublicKeyRetrieval", "true");
        defaults.put("useSSL", "false");

        StringBuilder mergedQuery = new StringBuilder(query);
        for (Map.Entry<String, String> entry : defaults.entrySet()) {
            if (existingKeys.contains(entry.getKey().toLowerCase(Locale.ROOT))) {
                continue;
            }
            if (mergedQuery.length() > 0) {
                mergedQuery.append('&');
            }
            mergedQuery.append(entry.getKey()).append('=').append(entry.getValue());
        }

        return mergedQuery.length() == 0 ? baseUrl : baseUrl + '?' + mergedQuery;
    }

    private String[] splitCredentials(String rawUserInfo) {
        if (isBlank(rawUserInfo)) {
            return new String[]{
                    firstNonBlank("DB_USERNAME", "DB_USER"),
                    firstNonBlank("DB_PASSWORD", "DB_PASS")
            };
        }

        String[] credentials = rawUserInfo.split(":", 2);
        return new String[]{
                decode(credentials[0]),
                credentials.length > 1 ? decode(credentials[1]) : ""
        };
    }

    private String firstNonBlank(String... keys) {
        for (String key : keys) {
            String value = environment.getProperty(key);
            if (!isBlank(value)) {
                return value.trim();
            }
        }
        return "";
    }

    private int readInt(String key, int fallback) {
        String value = environment.getProperty(key);
        if (value == null || value.isBlank()) {
            return fallback;
        }
        try {
            return Integer.parseInt(value.trim());
        } catch (NumberFormatException ex) {
            return fallback;
        }
    }

    private long readLong(String key, long fallback) {
        String value = environment.getProperty(key);
        if (value == null || value.isBlank()) {
            return fallback;
        }
        try {
            return Long.parseLong(value.trim());
        } catch (NumberFormatException ex) {
            return fallback;
        }
    }

    private String decode(String value) {
        return java.net.URLDecoder.decode(value, StandardCharsets.UTF_8);
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private record JdbcConnection(String jdbcUrl, String username, String password) {}
}
