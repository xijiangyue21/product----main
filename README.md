# StockPulse

当前仓库已经统一为：

- `backend-java/`：Java 21 + Spring Boot 后端
- `frontend/`：React + JavaScript + Vite 前端

旧的前后端实现已经清理完成，仓库当前只保留 Java 后端与 JavaScript 前端。

## 目录结构

```text
.
├── backend-java/              # Spring Boot backend
│   ├── src/main/java/com/stockpulse/backend/
│   │   ├── api/
│   │   ├── config/
│   │   ├── controller/
│   │   ├── entity/
│   │   ├── exception/
│   │   ├── repository/
│   │   ├── security/
│   │   └── service/
│   └── src/main/resources/application.yml
├── frontend/                  # React + Vite frontend
│   ├── src/components/
│   ├── src/config/
│   ├── src/constants/
│   ├── src/contexts/
│   ├── src/hooks/
│   ├── src/lib/
│   ├── src/pages/
│   ├── src/App.js
│   └── src/main.js
├── .env
├── .env.example
├── package.json               # 根目录辅助脚本
└── run-dev.ps1                # 启动 Java 后端 + 前端
```

## 技术栈

### 前端

- React 18
- JavaScript
- Vite
- Tailwind CSS v4
- Radix UI
- React Router

### 后端

- Java 21
- Spring Boot 3
- Spring Security
- Spring Data JPA
- PostgreSQL

## 运行方式

### 1. 启动全栈

在仓库根目录运行：

```powershell
.\run-dev.ps1
```

这个脚本会打开两个 PowerShell 窗口并启动：

- `backend-java`：`mvn spring-boot:run`
- `frontend`：`npm run dev`

默认会把前端 API 指向 Java 后端。

### 2. 单独启动后端

```powershell
cd backend-java
mvn spring-boot:run
```

### 3. 单独启动前端

```powershell
cd frontend
npm install
npm run dev
```

### 4. 构建前端

```powershell
cd frontend
npm run build
```

## 常用脚本

根目录：

```powershell
npm run dev
npm run backend:dev
npm run frontend:dev
npm run frontend:build
npm run frontend:lint
```

前端目录：

```powershell
npm run dev
npm run build
npm run preview
npm run lint
```

## 环境变量

项目统一读取根目录 `.env`。常用变量包括：

- `PORT`
- `DATABASE_URL`
- `DB_SSL`
- `JWT_SECRET`
- `CORS_ORIGINS`
- `ALIYUN_API_APP_CODE`
- `ALIYUN_API_ENDPOINT`
- `MARKET_API_BASE_URL`
- `AWS_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `BUCKET_NAME`
- `FOLDER_NAME`
- `DOCUMENT_ID`
- `SUBSCRIPTION_TIER`

可参考：

- `.env.example`

## 当前状态

- Java 后端已经覆盖认证、自选股、持仓、预警、上传、反馈、行情等模块
- 前端已经切换为纯 JavaScript 源码
- 仓库中的旧 TS 后端与 TS/TSX 前端源码已移除
