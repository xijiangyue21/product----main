package com.stockpulse.aihelper.ai;

import dev.langchain4j.data.message.ImageContent;
import dev.langchain4j.data.message.TextContent;
import dev.langchain4j.data.message.UserMessage;
import jakarta.annotation.Resource;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class StockAnalysisAssistantTest {

    @Resource
    private StockAnalysisAssistant stockAnalysisAssistant;

    @Test
    void chat() {
        stockAnalysisAssistant.chat("帮我分析一下贵州茅台");
    }

    @Test
    void chatWithMessage() {
        UserMessage userMessage = UserMessage.from(
                TextContent.from("描述这张股票相关图片"),
                ImageContent.from("https://dummyimage.com/600x400/edf2f7/1a202c&text=Stock+Chart")
        );
        stockAnalysisAssistant.chatWithMessage(userMessage);
    }
}
