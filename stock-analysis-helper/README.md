# AI 股票分析助手

基于 Spring Boot、LangChain4j、通义千问 / 阿里云百炼和 Vue3 的股票分析助手。它可以通过对话分析股票名称或代码，结合行情工具、近一年历史分析和 RAG 风险控制文档，输出结构化的趋势判断和风险提示。

## 功能

- 股票名称 / 代码识别
- 当前行情查询
- 近一年历史行情分析
- 趋势、风险点、观察位、仓位纪律输出
- SSE 流式回复
- RAG 检索股票分析框架和风险控制原则
- 固定风险提示：仅供学习和风险提示，不构成投资建议

## 环境变量

后端需要百炼 / DashScope API Key：

```powershell
$env:DASHSCOPE_API_KEY="你的百炼 API Key"
```

如果要让助手调用当前 StockPulse 后端行情接口：

```powershell
$env:STOCK_API_BASE_URL="http://localhost:3000"
$env:STOCK_API_TOKEN="可选，StockPulse 登录后的 JWT"
```

`STOCK_API_TOKEN` 只有在行情接口要求登录时才需要。搜索接口通常不需要。

## 启动

后端：

```powershell
mvn spring-boot:run
```

前端：

```powershell
cd stock-analysis-helper-frontend
npm install
npm run dev
```

前端开发地址：

```text
http://localhost:5174/index.html
```

前端默认调用：

```text
http://localhost:8081/api
```

如需修改：

```powershell
$env:VITE_API_BASE_URL="http://localhost:8081/api"
```

## 注意

本项目输出的是分析框架和风险提示，不承诺收益，不提供确定性买卖指令。
