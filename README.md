# StockPulse - 实时股票信息系统

A full-stack real-time stock information system built with React + Express, featuring an Obsidian Terminal dark-mode design.

## Project Structure

```
.
├── backend/
│   ├── config/           # App configuration (constants, passport, s3)
│   ├── db/
│   │   ├── index.ts      # Database connection
│   │   ├── schema.ts     # All table definitions + Zod schemas
│   │   └── migrations/   # SQL migration files
│   ├── middleware/
│   │   ├── auth.ts       # JWT authentication middleware (authenticateJWT)
│   │   └── errorHandler.ts
│   ├── repositories/     # Data access layer
│   │   ├── users.ts
│   │   ├── watchlist.ts  # Watchlist groups + items
│   │   ├── portfolio.ts  # Portfolio holdings
│   │   ├── alerts.ts     # Price alerts + history
│   │   ├── feedback.ts   # User feedback
│   │   └── upload.ts
│   ├── routes/           # API route handlers
│   │   ├── auth.ts       # POST /api/auth/signup, /login; GET /api/auth/me
│   │   ├── market.ts     # GET /api/market/indices, /quote/:code, /stocks, /sectors, /news, /fundamentals/:code, /kline/:code
│   │   ├── watchlist.ts  # CRUD /api/watchlist/groups + /items
│   │   ├── portfolio.ts  # CRUD /api/portfolio
│   │   ├── alerts.ts     # CRUD /api/alerts + GET /api/alerts/history
│   │   ├── feedback.ts   # POST /api/feedback
│   │   └── upload.ts
│   ├── services/
│   │   ├── aiService.ts
│   │   └── emailService.ts
│   └── server.ts         # Express entry point
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── ui/       # shadcn/ui components (DO NOT MODIFY)
│       │   └── custom/
│       │       ├── MarketView.tsx    # Real-time quotes, K-line chart, order book, sectors
│       │       ├── WatchlistView.tsx # Watchlist groups + stock management
│       │       ├── PortfolioView.tsx # Holdings management, P&L analysis
│       │       ├── AlertsView.tsx    # Price alert rules + trigger history
│       │       ├── NewsView.tsx      # Financial news + fundamentals analysis
│       │       ├── ProfileView.tsx   # User profile, settings, feedback, export
│       │       ├── Login.tsx         # Login form
│       │       ├── Signup.tsx        # Registration form
│       │       └── OmniflowBadge.tsx
│       ├── contexts/
│       │   └── AuthContext.tsx      # JWT auth state management
│       ├── config/
│       │   └── constants.ts         # API_BASE_URL
│       ├── lib/
│       │   ├── api.ts               # All API service methods (marketApi, watchlistApi, portfolioApi, alertsApi, feedbackApi, authApi)
│       │   └── utils.ts
│       ├── pages/
│       │   └── Index.tsx            # Main app shell with navigation
│       ├── types/
│       │   └── index.ts             # All TypeScript types
│       ├── App.tsx                  # HashRouter + AuthProvider + route protection
│       └── index.css                # Obsidian Terminal theme (oklch tokens)
```

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS V4, shadcn/ui, React Router DOM (HashRouter)
- **Backend**: Express.js, TypeScript, Drizzle ORM, Passport.js JWT
- **Database**: PostgreSQL (via postgres.js driver)
- **Auth**: JWT tokens stored in localStorage, bcrypt password hashing

## Key Features

1. **实时行情** - Market indices ticker, K-line charts, order book (盘口), sector rankings
2. **自选股管理** - Multiple watchlist groups, add/remove stocks
3. **持仓管理** - Portfolio holdings with P&L calculation, position weights
4. **预警系统** - Price/change alerts with App/SMS/WeChat notification channels, trigger history
5. **财经资讯** - News feed by category, fundamental analysis (PE/PB/ROE), corporate events
6. **个人中心** - User profile, theme settings, data export, feedback submission
7. **认证系统** - JWT-based login/signup with protected routes

## Database Tables

- `Users` - User accounts with theme/refresh preferences
- `WatchlistGroups` - Named watchlist groups per user
- `WatchlistItems` - Stocks in each watchlist group
- `PortfolioHoldings` - Stock holdings with cost/current price
- `Alerts` - Price alert rules with condition types and notification channels
- `AlertHistory` - Historical alert trigger records
- `Feedbacks` - User feedback submissions
- `Uploads` - File upload records

## Design System

Obsidian Terminal theme: deep dark background (#080C10), electric green accents (#00FF88), monospaced typography, bento-grid layout. All colors defined as oklch() tokens in `frontend/src/index.css`.

## Code Generation Guidelines

- All API routes require `authenticateJWT` middleware
- Repository methods accept `z.infer<typeof insertXSchema>` types, use `as InsertX` assertion in `.values()`
- Frontend API calls use `apiFetch<T>()` helper from `frontend/src/lib/api.ts`
- Navigation state managed in `Index.tsx` via `useState<ViewType>`
- Never modify `frontend/src/components/ui/` files
- Market data is simulated in `backend/routes/market.ts` (no external API dependency)
