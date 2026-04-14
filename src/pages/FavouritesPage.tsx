import { useState, useEffect } from 'react';
import { getQuote, type StockQuote } from '../api/finnhub';
import type { FavoriteStock } from '../hooks/useFavorites';

interface Props {
  favorites: FavoriteStock[];
  onSelect: (symbol: string, name: string) => void;
  onRemove: (symbol: string) => void;
}

type QuoteMap = Record<string, StockQuote>;

function SummaryCard({ label, value, sub, color }: { label: string; value: string | null; sub?: string; color: string }) {
  return (
    <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl p-4 flex flex-col gap-1.5">
      <span className="text-[11px] uppercase tracking-widest text-gray-600">{label}</span>
      {value === null ? (
        <div className="h-6 w-3/4 bg-[#2a2a4a] rounded-md animate-pulse mt-1" />
      ) : (
        <span className={`text-xl font-bold ${color}`}>
          {value}
          {sub && <span className="text-sm text-gray-600 ml-1">{sub}</span>}
        </span>
      )}
    </div>
  );
}

export default function FavouritesPage({ favorites, onSelect, onRemove }: Props) {
  const [quotes, setQuotes] = useState<QuoteMap>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (favorites.length === 0) return;
    let cancelled = false;
    setLoading(true);
    Promise.allSettled(
      favorites.map(({ symbol }) => getQuote(symbol).then((q) => ({ symbol, q })))
    ).then((results) => {
      if (cancelled) return;
      const map: QuoteMap = {};
      for (const r of results) {
        if (r.status === 'fulfilled') map[r.value.symbol] = r.value.q;
      }
      setQuotes(map);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [favorites]);

  if (favorites.length === 0) {
    return (
      <div className="mt-16 flex flex-col items-center gap-4 text-center">
        <svg className="w-14 h-14 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="text-gray-500 text-base">No favourites yet</p>
        <p className="text-gray-700 text-sm">Search for a stock and click the star to save it here</p>
      </div>
    );
  }

  const loaded = favorites.filter(({ symbol }) => quotes[symbol]);
  const gainers = loaded.filter(({ symbol }) => parseFloat(quotes[symbol].change) >= 0);
  const losers = loaded.filter(({ symbol }) => parseFloat(quotes[symbol].change) < 0);
  const sorted = [...loaded].sort(
    (a, b) => parseFloat(quotes[b.symbol].changePercent) - parseFloat(quotes[a.symbol].changePercent)
  );
  const topGainer = sorted[0];
  const topLoser = sorted[sorted.length - 1];

  return (
    <div className="mt-8 w-full space-y-5">

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <SummaryCard label="Watching" value={String(favorites.length)} sub={`stock${favorites.length !== 1 ? 's' : ''}`} color="text-violet-400" />
        <SummaryCard label="Gainers" value={loading ? null : String(gainers.length)} sub={`/ ${loaded.length}`} color="text-emerald-400" />
        <SummaryCard label="Losers" value={loading ? null : String(losers.length)} sub={`/ ${loaded.length}`} color="text-red-400" />
        <SummaryCard label="Top Gainer" value={topGainer ? topGainer.symbol : (loading ? null : '—')} color="text-emerald-400" />
        <SummaryCard label="Top Loser" value={topLoser ? topLoser.symbol : (loading ? null : '—')} color="text-red-400" />
      </div>

      {/* Full table */}
      <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2a4a]">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-yellow-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <span className="text-sm font-semibold text-gray-300">Your Favourites</span>
          </div>
          <span className="text-[10px] text-gray-600 uppercase tracking-wider">Live quotes</span>
        </div>

        {/* Header row */}
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-2 text-[10px] uppercase tracking-widest text-gray-600 border-b border-[#2a2a4a]">
          <span>Symbol / Company</span>
          <span className="text-right">Price</span>
          <span className="text-right">Change</span>
          <span className="text-right">Change %</span>
          <span className="w-6" />
        </div>

        <ul className="divide-y divide-[#2a2a4a]">
          {favorites.map(({ symbol, name }) => {
            const q = quotes[symbol];
            const positive = q ? parseFloat(q.change) >= 0 : null;
            return (
              <li key={symbol} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center px-5 py-4 hover:bg-[#1e1e35] transition-colors">
                <button
                  onClick={() => onSelect(symbol, name)}
                  className="flex flex-col text-left hover:opacity-80 transition-opacity"
                >
                  <span className="text-sm font-bold text-violet-400">{symbol}</span>
                  <span className="text-xs text-gray-500 truncate max-w-[200px]">{name}</span>
                </button>

                {q ? (
                  <span className="text-sm font-semibold text-gray-200 text-right">
                    ${parseFloat(q.price).toFixed(2)}
                  </span>
                ) : (
                  <div className="h-4 w-16 bg-[#2a2a4a] rounded animate-pulse" />
                )}

                {q ? (
                  <span className={`text-sm font-semibold text-right ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
                    {positive ? '+' : ''}{parseFloat(q.change).toFixed(2)}
                  </span>
                ) : (
                  <div className="h-4 w-14 bg-[#2a2a4a] rounded animate-pulse" />
                )}

                {q ? (
                  <span className={`text-xs font-semibold text-right px-2 py-0.5 rounded-full ${positive ? 'bg-emerald-400/10 text-emerald-400' : 'bg-red-400/10 text-red-400'}`}>
                    {positive ? '▲' : '▼'} {q.changePercent.replace('%', '')}%
                  </span>
                ) : (
                  <div className="h-5 w-16 bg-[#2a2a4a] rounded-full animate-pulse" />
                )}

                <button
                  onClick={() => onRemove(symbol)}
                  className="w-6 h-6 flex items-center justify-center text-gray-700 hover:text-red-400 transition-colors shrink-0"
                  title="Remove from favourites"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" />
                    <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" />
                  </svg>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
