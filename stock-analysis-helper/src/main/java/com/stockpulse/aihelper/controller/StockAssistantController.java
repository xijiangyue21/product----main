package com.stockpulse.aihelper.controller;

import com.stockpulse.aihelper.ai.StockAnalysisAssistantService;
import jakarta.annotation.Resource;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@RestController
@RequestMapping("/ai")
public class StockAssistantController {

    private static final String DISCLAIMER = "\n\n仅供学习和风险提示，不构成投资建议。";
    private static final ZoneId APP_ZONE = ZoneId.of("Asia/Shanghai");
    private static final DateTimeFormatter DATE_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy年M月d日（EEEE）", Locale.CHINA);

    @Resource
    private StockAnalysisAssistantService stockAnalysisAssistantService;

    @GetMapping("/chat")
    public Flux<ServerSentEvent<String>> chat(
            @RequestParam int memoryId,
            @RequestParam String message
    ) {
        return stockAnalysisAssistantService.chatStream(memoryId, withRuntimeContext(message))
                .concatWith(Flux.just(DISCLAIMER))
                .map(chunk -> ServerSentEvent.<String>builder()
                        .data(chunk)
                        .build());
    }

    private String withRuntimeContext(String message) {
        String today = LocalDate.now(APP_ZONE).format(DATE_FORMATTER);
        return """
                运行时上下文：
                - 当前日期：%s
                - 时区：Asia/Shanghai
                请以该当前日期为准，不要自行猜测日期。

                用户消息：
                %s
                """.formatted(today, message);
    }
}
