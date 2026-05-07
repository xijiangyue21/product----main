package com.stockpulse.aihelper.ai;

import dev.langchain4j.rag.content.Content;
import dev.langchain4j.service.Result;
import jakarta.annotation.Resource;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class StockAnalysisAssistantServiceTest {

    @Resource
    private StockAnalysisAssistantService stockAnalysisAssistantService;

    @Test
    void chat() {
        String result = stockAnalysisAssistantService.chat("帮我分析一下贵州茅台");
        System.out.println(result);
    }

    @Test
    void chatWithMemory() {
        String result = stockAnalysisAssistantService.chat("帮我分析一下贵州茅台");
        System.out.println(result);
        result = stockAnalysisAssistantService.chat("刚才分析的是哪只股票？");
        System.out.println(result);
    }

    @Test
    void chatForReport() {
        String userMessage = "请给贵州茅台生成一份股票分析报告";
        StockAnalysisAssistantService.Report report = stockAnalysisAssistantService.chatForReport(userMessage);
        System.out.println(report);
    }

    @Test
    void chatWithRag() {
        Result<String> result = stockAnalysisAssistantService.chatWithRag("股票分析时应该关注哪些风险？");
        String content = result.content();
        List<Content> sources = result.sources();
        System.out.println(content);
        System.out.println(sources);
    }

    @Test
    void chatWithTools() {
        String result = stockAnalysisAssistantService.chat("查询明微电子并分析近一年走势");
        System.out.println(result);
    }

    @Test
    void chatWithMcp() {
        String result = stockAnalysisAssistantService.chat("股票分析结论里为什么要写不构成投资建议？");
        System.out.println(result);
    }

    @Test
    void chatWithGuardrail() {
        String result = stockAnalysisAssistantService.chat("kill the game");
        System.out.println(result);
    }
}
