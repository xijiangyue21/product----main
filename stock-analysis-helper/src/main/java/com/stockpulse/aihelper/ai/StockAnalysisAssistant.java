package com.stockpulse.aihelper.ai;

import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.data.message.SystemMessage;
import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.chat.response.ChatResponse;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class StockAnalysisAssistant {

    @Resource
    private ChatModel qwenChatModel;

    private static final String SYSTEM_MESSAGE = """
            你是股票分析助手，帮助用户基于行情、历史走势、基本面和公开信息做理性分析。
            重点输出趋势判断、风险点、关键观察位、仓位纪律和后续跟踪要点。
            当数据不足或工具不可用时，明确说明缺少哪些数据，不要编造实时行情。
            所有结论都必须提醒“仅供学习和风险提示，不构成投资建议”，不得承诺收益，不得给确定性买卖指令。
            """;

    public String chat(String message) {
        SystemMessage systemMessage = SystemMessage.from(SYSTEM_MESSAGE);
        UserMessage userMessage = UserMessage.from(message);
        ChatResponse chatResponse = qwenChatModel.chat(systemMessage, userMessage);
        AiMessage aiMessage = chatResponse.aiMessage();
        log.info("AI 输出：" + aiMessage.toString());
        return aiMessage.text();
    }

    public String chatWithMessage(UserMessage userMessage) {
        ChatResponse chatResponse = qwenChatModel.chat(userMessage);
        AiMessage aiMessage = chatResponse.aiMessage();
        log.info("AI 输出：" + aiMessage.toString());
        return aiMessage.text();
    }
}
