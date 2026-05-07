package com.stockpulse.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class StockPulseApplication {

    public static void main(String[] args) {
        SpringApplication.run(StockPulseApplication.class, args);
    }
}
