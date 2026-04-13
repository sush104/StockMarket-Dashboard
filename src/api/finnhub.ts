const API_KEY = import.meta.env.VITE_FINNHUB_API_KEY as string;
const BASE_URL = 'https://finnhub.io/api/v1';

export interface SearchResult {
  symbol: string;
  name: string;
  type: string;
  region: string;
  currency: string;
}

export interface StockQuote {
  symbol: string;
  open: string;
  high: string;
  low: string;
  price: string;
  volume: string;
  latestTradingDay: string;
  previousClose: string;
  change: string;
  changePercent: string;
}

export async function searchSymbol(keywords: string): Promise<SearchResult[]> {
  const url = `${BASE_URL}/search?q=${encodeURIComponent(keywords)}&token=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Network error');
  const data = await res.json();
  const matches = data?.result ?? [];
  return matches.map((m: Record<string, string>) => ({
    symbol: m['symbol'],
    name: m['description'],
    type: m['type'],
    region: '',
    currency: '',
  }));
}

export interface EarningsEntry {
  date: string;           // "YYYY-MM-DD"
  epsActual: number | null;
  epsEstimate: number | null;
  revenueActual: number | null;
  revenueEstimate: number | null;
  quarter: number | null; // 1–4
  year: number | null;
}

export async function getEarningsCalendar(symbol: string): Promise<EarningsEntry[]> {
  // Fetch a wide window: 1 year back to 1 year ahead to capture both history and upcoming
  const from = new Date();
  from.setFullYear(from.getFullYear() - 1);
  const to = new Date();
  to.setFullYear(to.getFullYear() + 1);
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  const url = `${BASE_URL}/calendar/earnings?symbol=${encodeURIComponent(symbol)}&from=${fmt(from)}&to=${fmt(to)}&token=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Network error');
  const data = await res.json();
  const entries = data?.earningsCalendar ?? [];
  return (entries as Record<string, unknown>[])
    .map((e) => ({
      date:            String(e.date ?? ''),
      epsActual:       e.epsActual    != null ? Number(e.epsActual)    : null,
      epsEstimate:     e.epsEstimate  != null ? Number(e.epsEstimate)  : null,
      revenueActual:   e.revenueActual   != null ? Number(e.revenueActual)   : null,
      revenueEstimate: e.revenueEstimate != null ? Number(e.revenueEstimate) : null,
      quarter:         e.quarter != null ? Number(e.quarter) : null,
      year:            e.year    != null ? Number(e.year)    : null,
    }))
    .sort((a, b) => b.date.localeCompare(a.date)) // newest first
    .slice(0, 8);
}

export interface CompanyProfile {
  name: string;
  logo: string;
  industry: string;
  exchange: string;
  country: string;
  currency: string;
  ipo: string;
  website: string;
  marketCap: number | null;
  shareOutstanding: number | null;
}

export async function getCompanyProfile(symbol: string): Promise<CompanyProfile> {
  const url = `${BASE_URL}/stock/profile2?symbol=${encodeURIComponent(symbol)}&token=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Network error');
  const d = await res.json();
  return {
    name:             d.name             ?? '',
    logo:             d.logo             ?? '',
    industry:         d.finnhubIndustry  ?? '',
    exchange:         d.exchange         ?? '',
    country:          d.country          ?? '',
    currency:         d.currency         ?? '',
    ipo:              d.ipo              ?? '',
    website:          d.weburl           ?? '',
    marketCap:        d.marketCapitalization ?? null,
    shareOutstanding: d.shareOutstanding     ?? null,
  };
}

export interface BasicFinancials {
  marketCap: number | null;       // in millions USD
  pe: number | null;
  beta: number | null;
  week52High: number | null;
  week52Low: number | null;
  dividendYield: number | null;   // annual, %
  eps: number | null;
}

export async function getBasicFinancials(symbol: string): Promise<BasicFinancials> {
  const url = `${BASE_URL}/stock/metric?symbol=${encodeURIComponent(symbol)}&metric=all&token=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Network error');
  const data = await res.json();
  const m = data?.metric ?? {};
  return {
    marketCap:     m['marketCapitalization']           ?? null,
    pe:            m['peBasicExclExtraTTM']             ?? null,
    beta:          m['beta']                            ?? null,
    week52High:    m['52WeekHigh']                      ?? null,
    week52Low:     m['52WeekLow']                       ?? null,
    dividendYield: m['dividendYieldIndicatedAnnual']    ?? null,
    eps:           m['epsBasicExclExtraAnnual']          ?? null,
  };
}

export interface PriceTarget {
  targetHigh: number | null;
  targetLow: number | null;
  targetMean: number | null;
  targetMedian: number | null;
  lastUpdated: string | null;
}

export async function getPriceTarget(symbol: string): Promise<PriceTarget> {
  const url = `${BASE_URL}/stock/price-target?symbol=${encodeURIComponent(symbol)}&token=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Network error');
  const data = await res.json();
  return {
    targetHigh:   data.targetHigh   ?? null,
    targetLow:    data.targetLow    ?? null,
    targetMean:   data.targetMean   ?? null,
    targetMedian: data.targetMedian ?? null,
    lastUpdated:  data.lastUpdated  ?? null,
  };
}

export interface MarketStatus {
  isOpen: boolean;
  session: string | null;  // "regular" | "pre-market" | "post-market" | null
  timezone: string;
  holiday: string | null;
}

export async function getMarketStatus(exchange = 'US'): Promise<MarketStatus> {
  const url = `${BASE_URL}/stock/market-status?exchange=${exchange}&token=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Network error');
  const data = await res.json();
  return {
    isOpen:   data.isOpen   ?? false,
    session:  data.session  ?? null,
    timezone: data.timezone ?? 'America/New_York',
    holiday:  data.holiday  ?? null,
  };
}

export interface CandlePoint {
  time: string;   // 'YYYY-MM-DD' — required by lightweight-charts
  date: string;   // 'MMM D'  — for display labels
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface RecommendationTrend {
  period: string;       // e.g. "2024-03-01"
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
}

export async function getRecommendationTrends(symbol: string): Promise<RecommendationTrend[]> {
  const url = `${BASE_URL}/stock/recommendation?symbol=${encodeURIComponent(symbol)}&token=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Network error');
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data.slice(0, 4); // last 4 periods
}

export interface NewsItem {
  id: number;
  datetime: number;
  headline: string;
  summary: string;
  source: string;
  url: string;
  image: string;
}

export async function getMarketNews(category: 'general' | 'forex' | 'crypto' | 'merger' = 'general'): Promise<NewsItem[]> {
  const url = `${BASE_URL}/news?category=${category}&token=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Network error');
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data.slice(0, 50); // fetch up to 50 for modal
}

export async function getCompanyNews(symbol: string, days = 14): Promise<NewsItem[]> {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  const url = `${BASE_URL}/company-news?symbol=${encodeURIComponent(symbol)}&from=${fmt(from)}&to=${fmt(to)}&token=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Network error');
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data.slice(0, 50); // fetch up to 50 for modal
}

export async function getQuote(symbol: string): Promise<StockQuote> {
  const url = `${BASE_URL}/quote?symbol=${encodeURIComponent(symbol)}&token=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Network error');
  const data = await res.json();
  if (!data || data.c === undefined) throw new Error('No quote data found');
  const change = (data.c - data.pc).toFixed(2);
  const changePercent = data.pc ? (((data.c - data.pc) / data.pc) * 100).toFixed(2) + '%' : '0%';
  return {
    symbol,
    open: String(data.o),
    high: String(data.h),
    low: String(data.l),
    price: String(data.c),
    volume: 'N/A',
    latestTradingDay: new Date(data.t * 1000).toISOString().split('T')[0],
    previousClose: String(data.pc),
    change,
    changePercent,
  };
}
