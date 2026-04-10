const API_KEY = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY as string;
const BASE_URL = 'https://www.alphavantage.co/query';

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
  const url = `${BASE_URL}?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(keywords)}&apikey=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Network error');
  const data = await res.json();
  const matches = data?.bestMatches ?? [];
  return matches.map((m: Record<string, string>) => ({
    symbol: m['1. symbol'],
    name: m['2. name'],
    type: m['3. type'],
    region: m['4. region'],
    currency: m['8. currency'],
  }));
}

export async function getQuote(symbol: string): Promise<StockQuote> {
  const url = `${BASE_URL}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Network error');
  const data = await res.json();
  const q = data?.['Global Quote'];
  if (!q || !q['01. symbol']) throw new Error('No quote data found');
  return {
    symbol: q['01. symbol'],
    open: q['02. open'],
    high: q['03. high'],
    low: q['04. low'],
    price: q['05. price'],
    volume: q['06. volume'],
    latestTradingDay: q['07. latest trading day'],
    previousClose: q['08. previous close'],
    change: q['09. change'],
    changePercent: q['10. change percent'],
  };
}
