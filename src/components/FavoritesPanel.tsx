import { useState, useEffect } from 'react';
import { getQuote, type StockQuote } from '../api/finnhub';
import type { FavoriteStock } from '../hooks/useFavorites';

interface Props {
  favorites: FavoriteStock[];
  onSelect: (symbol: string, name: string) => void;
  onRemove: (symbol: string) => void;
}

type QuoteMap = Record<string, StockQuote>;

export default function FavoritesPanel({ favorites, onSelect, onRemove }: Props) {
  const [quotes, setQuotes] = useState<QuoteMap>({});

  useEffect(() => {
    if (favorites.length === 0) return;
    let cancelled = false;
    Promise.allSettled(
      favorites.map(({ symbol }) => getQuote(symbol).then((q) => ({ symbol, q })))
    ).then((results) => {
      if (cancelled) return;
      const map: QuoteMap = {};
      for (const r of results) {
        if (r.status === 'fulfilled') map[r.value.symbol] = r.value.q;
      }
      setQuotes(map);
    });
    return () => { cancelled = true; };
  }, [favorites]);

  if (favorites.length === 0) return null;

  return (
    <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2a4a]">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-yellow-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <span className="text-sm font-semibold text-gray-300">Favourites</span>
        </div>
        <span className="text-[10px] text-gray-600 uppercase tracking-wider">{favorites.length} stock{favorites.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Header row */}
      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-2 text-[10px] uppercase tracking-widest text-gray-600 border-b border-[#2a2a4a]">
        <span>Symbol</span>
        <span className="text-right">Price</span>
        <span className="text-right">Change</span>
        <span className="w-6" />
      </div>

      <ul className="divide-y divide-[#2a2a4a]">
        {favorites.map(({ symbol, name }) => {
          const q = quotes[symbol];
          const positive = q ? parseFloat(q.change) >= 0 : null;
          return (
            <li key={symbol} className="grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-5 py-3 group">
              <button
                onClick={() => onSelect(symbol, name)}
                className="flex flex-col text-left hover:opacity-80 transition-opacity"
              >
                <span className="text-sm font-bold text-violet-400">{symbol}</span>
                <span className="text-xs text-gray-600 truncate">{name}</span>
              </button>

              {/* Price */}
              {q ? (
                <span className="text-sm font-semibold text-gray-200 text-right">
                  ${parseFloat(q.price).toFixed(2)}
                </span>
              ) : (
                <div className="h-4 w-16 bg-[#2a2a4a] rounded animate-pulse" />
              )}

              {/* Change */}
              {q ? (
                <span className={`text-xs font-semibold text-right ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
                  {positive ? '+' : ''}{parseFloat(q.change).toFixed(2)}{' '}
                  <span className="opacity-70">({q.changePercent.replace('%', '')}%)</span>
                </span>
              ) : (
                <div className="h-4 w-20 bg-[#2a2a4a] rounded animate-pulse" />
              )}

              {/* Remove button */}
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
  );
}
