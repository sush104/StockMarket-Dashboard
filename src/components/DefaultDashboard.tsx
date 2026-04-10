import { useState, useEffect } from 'react';
import { getQuote, type StockQuote } from '../api/finnhub';

const POPULAR = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'MSFT', name: 'Microsoft Corp.' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.' },
  { symbol: 'AMZN', name: 'Amazon.com' },
  { symbol: 'TSLA', name: 'Tesla Inc.' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.' },
];

interface Props {
  onSelect: (symbol: string, name: string) => void;
}

type QuoteMap = Record<string, StockQuote>;

function PricePill({ quote }: { quote?: StockQuote }) {
  if (!quote) return <div className="h-4 w-16 bg-[#2a2a4a] rounded animate-pulse" />;
  const positive = parseFloat(quote.change) >= 0;
  return (
    <span className={`text-xs font-semibold ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
      {positive ? '▲' : '▼'} {quote.changePercent.replace('%', '')}%
    </span>
  );
}

export default function DefaultDashboard({ onSelect }: Props) {
  const [quotes, setQuotes] = useState<QuoteMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled(
      POPULAR.map(({ symbol }) =>
        getQuote(symbol).then((q) => ({ symbol, q }))
      )
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
  }, []);

  // Derived: top gainer + top loser among loaded quotes
  const loaded = POPULAR.filter(({ symbol }) => quotes[symbol]);
  const sorted = [...loaded].sort(
    (a, b) => parseFloat(quotes[b.symbol].changePercent) - parseFloat(quotes[a.symbol].changePercent)
  );
  const topGainer = sorted[0];
  const topLoser = sorted[sorted.length - 1];

  const summaryCards = [
    {
      label: 'Top Gainer',
      symbol: topGainer?.symbol,
      value: topGainer ? `$${parseFloat(quotes[topGainer.symbol].price).toFixed(2)}` : null,
      change: topGainer ? quotes[topGainer.symbol] : undefined,
      color: 'text-emerald-400',
    },
    {
      label: 'Top Loser',
      symbol: topLoser?.symbol,
      value: topLoser ? `$${parseFloat(quotes[topLoser.symbol].price).toFixed(2)}` : null,
      change: topLoser ? quotes[topLoser.symbol] : undefined,
      color: 'text-red-400',
    },
    {
      label: 'Gainers',
      value: loading ? null : String(loaded.filter(({ symbol }) => parseFloat(quotes[symbol].change) >= 0).length),
      suffix: `/ ${POPULAR.length}`,
      color: 'text-emerald-400',
    },
    {
      label: 'Losers',
      value: loading ? null : String(loaded.filter(({ symbol }) => parseFloat(quotes[symbol].change) < 0).length),
      suffix: `/ ${POPULAR.length}`,
      color: 'text-red-400',
    },
  ];

  return (
    <div className="mt-8 w-full space-y-5">

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl p-4 flex flex-col gap-1.5">
            <span className="text-[11px] uppercase tracking-widest text-gray-600">{card.label}</span>
            {card.value === null ? (
              <div className="h-6 w-3/4 bg-[#2a2a4a] rounded-md animate-pulse mt-1" />
            ) : (
              <>
                <span className={`text-xl font-bold ${card.color}`}>
                  {card.value}
                  {card.suffix && <span className="text-sm text-gray-600 ml-1">{card.suffix}</span>}
                </span>
                {card.symbol && (
                  <span className="text-xs text-gray-600">{card.symbol}</span>
                )}
                {card.change && <PricePill quote={card.change} />}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Popular stocks table */}
      <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2a4a]">
          <span className="text-sm font-semibold text-gray-300">Popular Stocks</span>
          <span className="text-[10px] text-gray-600 uppercase tracking-wider">Live quotes</span>
        </div>

        {/* Header row */}
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-2 text-[10px] uppercase tracking-widest text-gray-600 border-b border-[#2a2a4a]">
          <span>Symbol</span>
          <span className="text-right">Price</span>
          <span className="text-right">Change</span>
          <span className="text-right w-6" />
        </div>

        <ul className="divide-y divide-[#2a2a4a]">
          {POPULAR.map(({ symbol, name }) => {
            const q = quotes[symbol];
            const positive = q ? parseFloat(q.change) >= 0 : null;
            return (
              <li key={symbol}>
                <button
                  onClick={() => onSelect(symbol, name)}
                  className="w-full grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-5 py-3 hover:bg-[#22223a] transition-colors group text-left"
                >
                  <div>
                    <span className="block text-sm font-bold text-violet-400">{symbol}</span>
                    <span className="block text-xs text-gray-600 truncate">{name}</span>
                  </div>

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

                  <svg className="w-4 h-4 text-gray-700 group-hover:text-violet-400 transition-colors shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
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
