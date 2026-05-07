package com.stockpulse.backend.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class AlertCheckScheduler {

    private final AlertsService alertsService;

    public AlertCheckScheduler(AlertsService alertsService) {
        this.alertsService = alertsService;
    }

    @Scheduled(
            initialDelayString = "${stockpulse.alerts.initial-delay-ms:15000}",
            fixedDelayString = "${stockpulse.alerts.check-delay-ms:60000}"
    )
    public void checkActiveAlerts() {
        alertsService.checkAllActiveAlerts();
    }
}
