# StockPulse

StockPulse 是一个前后端分离的股票信息与个人投资管理系统，当前仓库包含：

- `frontend/`：React 18 + Vite 前端
- `backend-java/`：Java 21 + Spring Boot 3 后端

项目已经覆盖注册登录、行情浏览、股票搜索、自选股、持仓、预警、资讯、反馈、上传等模块，适合本地联调、课程作业演示和功能迭代。

## 功能概览

- 用户注册、登录、JWT 鉴权
- 行情首页、股票搜索、个股详情、K 线、涨幅榜
- 自选股分组与条目管理
- 持仓录入、编辑、删除
- 价格预警与历史记录
- 新闻资讯与用户反馈
- 基于 S3 预签名 URL 的文件上传

## 技术栈

### 前端

- React 18
- Vite 5
- Tailwind CSS v4
- Radix UI
- React Router

### 后端

- Java 21
- Spring Boot 3.3
- Spring Security
- Spring Data JPA
- MySQL
- AWS S3 Presigner

## 目录结构

```text
.
├── backend-java/              # Spring Boot 后端
│   ├── src/main/java/com/stockpulse/backend/
│   │   ├── api/
│   │   ├── config/
│   │   ├── controller/
│   │   ├── entity/
│   │   ├── exception/
│   │   ├── repository/
│   │   ├── security/
│   │   └── service/
│   ├── src/main/resources/application.yml
│   ├── pom.xml
│   └── run-backend.ps1
├── frontend/                  # React + Vite 前端
│   ├── src/components/
│   ├── src/config/
│   ├── src/constants/
│   ├── src/contexts/
│   ├── src/hooks/
│   ├── src/lib/
│   ├── src/pages/
│   ├── package.json
│   └── vite.config.js
├── .env.example               # 根目录环境变量模板
├── package.json               # 根目录辅助脚本
├── run-dev.ps1                # 一键启动前后端
└── test-login.js              # 本地登录冒烟脚本
```

## 运行前准备

建议先准备好以下环境：

- JDK 21
- Maven，并确保 `mvn` 已加入 PATH，或配置了 `MAVEN_HOME` / `M2_HOME`
- Node.js 与 npm
- MySQL 数据库
- Windows PowerShell

根目录的一键启动脚本 `run-dev.ps1` 是 PowerShell 脚本，默认面向 Windows 环境。

## 环境变量

后端会优先读取根目录 `.env`。可以先复制模板：

```powershell
Copy-Item .env.example .env
```

最小可运行配置如下：

```env
DATABASE_URL=mysql://username:password@host:3306/stockpulse?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Shanghai
JWT_SECRET=replace-with-a-long-random-secret
PORT=3000
```

### 必填变量

- `DATABASE_URL`：后端启动必填，推荐格式为 MySQL URI，例如 `mysql://user:password@localhost:3306/stockpulse`
- `JWT_SECRET`：JWT 签名密钥，生产环境务必替换

### 常用可选变量

- `DB_USERNAME` / `DB_PASSWORD`：当 `DATABASE_URL` 使用 `jdbc:mysql://...` 且未在 URL 中携带账号密码时使用
- `CORS_ORIGINS`：额外允许的前端来源，多个值用逗号分隔
- `MARKET_API_BASE_URL` / `MARKET_API_APP_CODE`
- `ALIYUN_API_ENDPOINT` / `ALIYUN_API_APP_CODE`
- `AWS_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `BUCKET_NAME`
- `FOLDER_NAME`
- `DOCUMENT_ID`
- `SUBSCRIPTION_TIER`
- `UPLOAD_FOLDER_PREFIX` 或 `S3_FOLDER_PREFIX`

### 说明

- 当前 Java 后端真正读取的行情配置是 `MARKET_API_BASE_URL` + `MARKET_API_APP_CODE`，也兼容旧变量 `ALIYUN_API_ENDPOINT` + `ALIYUN_API_APP_CODE`
- 前端默认从 `frontend/.env.development` 读取 `VITE_API_URL=http://localhost:3000`

## 数据库说明

项目当前不会自动建表：

- `spring.jpa.hibernate.ddl-auto=none`
- `hibernate.globally_quoted_identifiers=false`

这意味着你需要先准备好数据库表结构，再启动后端。实体表名仍使用与 Java 实体一致的名称：

- `Users`
- `PortfolioHoldings`
- `WatchlistGroups`
- `WatchlistItems`
- `Alerts`
- `AlertHistory`
- `AiAdviceRecords`
- `Feedbacks`
- `Uploads`

其中 `AiAdviceRecords` 会通过 `backend-java/src/main/resources/schema.sql` 使用 MySQL 语法的 `CREATE TABLE IF NOT EXISTS` 自动补齐，用于保存登录用户的 AI 投资建议记录。

如果数据库没有导入这些表，应用可能能启动，但注册、持仓、自选股、预警等接口会在运行时报错。

## 快速开始

### 方式 1：一键启动前后端

在仓库根目录执行：

```powershell
npm run dev
```

或：

```powershell
.\run-dev.ps1
```

该脚本会打开两个 PowerShell 窗口并执行：

- 后端：`mvn spring-boot:run`
- 前端：`npm run dev`

脚本会读取根目录 `.env` 中的 `PORT`，并把前端运行时 `VITE_API_URL` 注入为同一个地址，避免前后端端口不一致。

### 方式 2：只启动后端

```powershell
cd backend-java
.\run-backend.ps1
```

或：

```powershell
cd backend-java
mvn spring-boot:run
```

如果没有额外设置，后端默认端口来自 `.env` 中的 `PORT`，默认值为 `3000`。

### 方式 3：只启动前端

```powershell
cd frontend
npm install
npm run dev
```

如果你的后端不在 `3000` 端口启动，需要在前端启动前覆盖接口地址：

```powershell
$env:VITE_API_URL="http://localhost:3000"
npm run dev
```

## 常用命令

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

## 认证与接口访问

后端默认要求 JWT 鉴权，以下接口允许匿名访问：

- `/api/auth/login`
- `/api/auth/signup`
- `/api/market/search`
- `/api/upload/presigned-url`
- `/api/upload/complete`

其余业务接口默认需要在请求头中携带 `Authorization: Bearer <token>`。

## 行情数据说明

当前行情能力是“实时接口 + mock 数据”混合模式：

- 已配置行情供应商时，股票榜单、部分股票列表、K 线和部分搜索补全会优先使用第三方接口
- 未配置行情供应商时，系统会自动回退到内置 mock 数据，方便前端联调和演示
- 个股详情、资讯、板块、财务指标等模块目前仍以内置 mock 数据为主

这意味着项目即使没有接入完整的第三方行情服务，依然可以完成大部分页面展示与交互测试。

## 本地冒烟测试

仓库根目录提供了一个简单的登录测试脚本：

```powershell
$env:LOGIN_EMAIL="your@email.com"
$env:LOGIN_PASSWORD="your-password"
node .\test-login.js
```

注意：

- 该脚本默认请求 `http://localhost:${PORT || 3000}/api/auth/login`
- 如果你修改了根目录 `.env` 里的 `PORT`，可设置 `$env:API_BASE_URL="http://localhost:<PORT>"` 后再运行

## 常见问题

- 提示找不到 Maven：确认 `mvn` 在 PATH 中，或已正确配置 `MAVEN_HOME` / `M2_HOME`
- 提示 `DATABASE_URL is required`：说明根目录 `.env` 未配置或为空
- 前端能打开但业务接口全报错：通常是数据库表结构还没准备好
- 上传接口返回 503：通常是 AWS S3 相关配置未填写
- 前端请求到了错误端口：检查 `VITE_API_URL`、`.env` 中的 `PORT`，以及是否使用了 `run-dev.ps1`

## 补充说明

- 根目录 README 面向整个工作区；如果只关心后端，也可以查看 `backend-java/README.md`
- 当前仓库已经统一为 Java 后端 + JavaScript 前端
