# 📈 StockMarket Dashboard

A real-time stock market dashboard built with **React**, **TypeScript**, and **Vite** — powered by the [Finnhub API](https://finnhub.io). Features a dark/light theme, interactive charts, analyst data, earnings history, and live market news.

---

## Features

### Stock Search

- Instant symbol/company name search with 500ms debounce
- Dropdown results with symbol, name, region, and currency
- Selected symbol persists in the search bar across navigation

### Default Dashboard

- Live quotes for 6 popular stocks (AAPL, MSFT, GOOGL, AMZN, TSLA, NVDA)
- Top Gainer / Top Loser / Gainers count summary cards
- Click any stock card to load its full dashboard

### Dashboard (per symbol)

- **Hero Card** — live price, change %, and day metrics (Open, Prev Close, High, Low)
- **Company Profile** — logo, industry, exchange, country, IPO date, website link, market cap
- **Analyst Recommendations** — interactive donut chart (Recharts) for the selected period; click any period row to update the chart; trend period selector
- **Earnings Calendar** — EPS surprise bar chart + table with Beat/Miss badges and upcoming earnings highlighted
- **Market Data** — fundamentals (Market Cap, P/E, EPS, Beta, 52W High/Low, Dividend Yield), market open/closed status badge, and analyst price target range bar (Low → Mean → High)
- **News Panel** — tabbed Company News / Market News, top 5 preview with "Show all" modal (up to 50 articles); lazy-loads market news

### Favourites Page

- Star any stock from the Dashboard to save it to your Favourites list
- Live quotes fetched in parallel for all saved stocks
- Summary cards: total watching, gainers count, losers count, top gainer, and top loser
- Each card shows live price, change %, and a remove (unstar) button
- Click any card to jump straight to that stock's full Dashboard
- Empty state prompt when no favourites are saved

### Portfolio Page

- Track stock holdings by logging a buy price and quantity via the **+ Track** button on any stock's Dashboard
- Summary cards: total invested, current value, overall P&L (₹ and %), and number of positions
- Per-stock rows showing individual lots with buy price, quantity, current price, and gain/loss
- Remove individual lots directly from the table
- Click any symbol to navigate to its full Dashboard
- Empty state prompt when no holdings are tracked

### UI

- **Dark / Light mode toggle** — persisted to `localStorage`
- **Navbar** with Dashboard, Favourites (with live count badge), and Portfolio (with holdings count badge) tabs; active tab highlighted with a black border
- Fully responsive layout (single column on mobile, 3-column grid on desktop)
- Consistent dark card system (`#1a1a2e` / `#12122a`) with CSS-override light theme

---

## Tech Stack

| Layer     | Library                                      |
| --------- | -------------------------------------------- |
| Framework | React 19 + TypeScript                        |
| Build     | Vite 8                                       |
| Styling   | Tailwind CSS v4                              |
| Charts    | Recharts 3 (donut)                           |
| Data      | [Finnhub REST API](https://finnhub.io/docs/api) |

---

## Getting Started

### 1. Clone & install

```bash
git clone https://github.com/your-username/StockMarket-Dashboard.git
cd StockMarket-Dashboard
npm install
```

### 2. Add your Finnhub API key

Create a `.env` file in the project root:

```env
VITE_FINNHUB_API_KEY=your_api_key_here
```

Get a free key at [finnhub.io](https://finnhub.io).

### 3. Run the dev server

```bash
npm run dev
```

### 4. Build for production

```bash
npm run build
```

---

## Project Structure

```
src/
├── api/
│   └── finnhub.ts          # All Finnhub API calls and TypeScript interfaces
├── components/
│   ├── CompanyProfile.tsx   # Logo, industry, IPO, website
│   ├── DefaultDashboard.tsx # Popular stocks landing screen
│   ├── EarningsCalendar.tsx # EPS surprise chart + earnings table
│   ├── MarketData.tsx       # Fundamentals, market status, price target
│   ├── NewsPanel.tsx        # Tabbed company/market news with modal
│   ├── RecommendationTrends.tsx # Donut chart + period selector
│   ├── StockDashboard.tsx   # Main dashboard layout orchestrator
│   ├── StockSearch.tsx      # Debounced search with dropdown
│   └── ThemeToggle.tsx      # Dark/light mode toggle button
└── App.tsx                  # Root layout, theme state, routing
```

---

## API Endpoints Used

| Endpoint                  | Used for                            |
| ------------------------- | ----------------------------------- |
| `/search`               | Symbol/company search               |
| `/quote`                | Live price, change, OHLC            |
| `/stock/profile2`       | Company profile                     |
| `/stock/metric`         | Fundamentals (P/E, EPS, Beta, etc.) |
| `/stock/price-target`   | Analyst price targets               |
| `/stock/market-status`  | Market open/closed status           |
| `/stock/recommendation` | Analyst buy/hold/sell trends        |
| `/calendar/earnings`    | Earnings history and upcoming dates |
| `/company-news`         | Company-specific news               |
| `/news`                 | General market news                 |

---
