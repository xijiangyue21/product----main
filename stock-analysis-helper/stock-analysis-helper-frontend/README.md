# AI 股票分析助手前端

Vue3 + Vite 聊天前端，负责通过 SSE 调用后端 `/api/ai/chat`，展示股票分析助手的流式回复。

## 启动

```powershell
npm install
npm run dev
```

默认后端地址：

```text
http://localhost:8081/api
```

如需覆盖：

```powershell
$env:VITE_API_BASE_URL="http://localhost:8081/api"
```
