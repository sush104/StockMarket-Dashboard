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
