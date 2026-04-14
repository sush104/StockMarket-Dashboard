import { useState, useEffect } from 'react';
import { getQuote, type StockQuote } from '../api/finnhub';
import type { Holding } from '../hooks/usePortfolio';

interface Props {
  holdings: Holding[];
  onSelect: (symbol: string, name: string) => void;
  onRemoveLot: (id: string) => void;
}

type QuoteMap = Record<string, StockQuote>;

function MetricCard({
  label,
  value,
  sub,
  positive,
}: {
  label: string;
  value: string | null;
  sub?: string;
  positive?: boolean | null;
}) {
  const color =
    positive === true ? 'text-emerald-400' : positive === false ? 'text-red-400' : 'text-violet-400';
  return (
    <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl p-4 flex flex-col gap-1">
      <span className="text-[11px] uppercase tracking-widest text-gray-600">{label}</span>
      {value === null ? (
        <div className="h-6 w-3/4 bg-[#2a2a4a] rounded-md animate-pulse mt-1" />
      ) : (
        <>
          <span className={`text-xl font-bold ${color}`}>{value}</span>
          {sub && <span className="text-xs text-gray-600">{sub}</span>}
        </>
      )}
    </div>
  );
}

export default function PortfolioPage({ holdings, onSelect, onRemoveLot }: Props) {
  const [quotes, setQuotes] = useState<QuoteMap>({});
  const [loading, setLoading] = useState(false);

  // unique symbols for fetching quotes
  const symbols = [...new Set(holdings.map((h) => h.symbol))];

  useEffect(() => {
    if (symbols.length === 0) return;
    let cancelled = false;
    setLoading(true);
    Promise.allSettled(
      symbols.map((symbol) => getQuote(symbol).then((q) => ({ symbol, q })))
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holdings]);

  if (holdings.length === 0) {
    return (
      <div className="mt-16 flex flex-col items-center gap-4 text-center">
        <svg className="w-14 h-14 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 12l10-10 10 10" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 10v10h6v-6h4v6h6V10" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="text-gray-500 text-base">No investments tracked yet</p>
        <p className="text-gray-700 text-sm max-w-xs">
          Search for a stock, then click the <span className="text-emerald-400 font-semibold">+ Track</span> button to log your buy price and shares
        </p>
      </div>
    );
  }

  // Aggregate portfolio totals
  let totalInvested = 0;
  let totalCurrentValue = 0;
  let anyLoaded = false;

  for (const h of holdings) {
    totalInvested += h.buyPrice * h.quantity;
    const q = quotes[h.symbol];
    if (q) {
      totalCurrentValue += parseFloat(q.price) * h.quantity;
      anyLoaded = true;
    }
  }

  const totalPnl = totalCurrentValue - totalInvested;
  const totalPnlPct = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;
  const portfolioPositive = totalPnl >= 0;

  // Group lots by symbol
  const grouped = symbols.map((symbol) => {
    const lots = holdings.filter((h) => h.symbol === symbol);
    const name = lots[0].name;
    const totalShares = lots.reduce((s, h) => s + h.quantity, 0);
    const totalLotInvested = lots.reduce((s, h) => s + h.buyPrice * h.quantity, 0);
    const avgBuyPrice = totalLotInvested / totalShares;
    const q = quotes[symbol];
    const currentPrice = q ? parseFloat(q.price) : null;
    const currentVal = currentPrice !== null ? currentPrice * totalShares : null;
    const pnl = currentVal !== null ? currentVal - totalLotInvested : null;
    const pnlPct = pnl !== null ? (pnl / totalLotInvested) * 100 : null;
    const positive = pnl !== null ? pnl >= 0 : null;
    return { symbol, name, lots, totalShares, avgBuyPrice, totalLotInvested, currentPrice, currentVal, pnl, pnlPct, positive };
  });

  return (
    <div className="mt-8 w-full space-y-5">

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard
          label="Positions"
          value={`${symbols.length}`}
          sub={`${holdings.length} lot${holdings.length !== 1 ? 's' : ''}`}
        />
        <MetricCard label="Total Invested" value={`$${totalInvested.toFixed(2)}`} />
        <MetricCard
          label="Current Value"
          value={anyLoaded ? `$${totalCurrentValue.toFixed(2)}` : (loading ? null : '—')}
          positive={portfolioPositive}
        />
        <MetricCard
          label="Total P&L"
          value={anyLoaded ? `${portfolioPositive ? '+' : ''}$${totalPnl.toFixed(2)}` : (loading ? null : '—')}
          sub={anyLoaded ? `${portfolioPositive ? '▲' : '▼'} ${Math.abs(totalPnlPct).toFixed(2)}%` : undefined}
          positive={portfolioPositive}
        />
      </div>

      {/* Holdings table */}
      <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2a4a]">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 12l10-10 10 10" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4 10v10h6v-6h4v6h6V10" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-sm font-semibold text-gray-300">My Portfolio</span>
          </div>
          <span className="text-[10px] text-gray-600 uppercase tracking-wider">Live P&amp;L</span>
        </div>

        {/* Header */}
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto_auto] gap-3 px-5 py-2 text-[10px] uppercase tracking-widest text-gray-600 border-b border-[#2a2a4a]">
          <span>Symbol</span>
          <span className="text-right">Shares</span>
          <span className="text-right">Avg Buy</span>
          <span className="text-right">Current</span>
          <span className="text-right">Invested</span>
          <span className="text-right">P&amp;L</span>
          <span className="w-6" />
        </div>

        <ul className="divide-y divide-[#2a2a4a]">
          {grouped.map(({ symbol, name, lots, totalShares, avgBuyPrice, totalLotInvested, currentPrice, pnl, pnlPct, positive }) => (
            <li key={symbol}>
              {/* Symbol summary row */}
              <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto_auto] gap-3 items-center px-5 py-4 bg-[#1a1a2e] hover:bg-[#1e1e35] transition-colors">
                <button
                  onClick={() => onSelect(symbol, name)}
                  className="flex flex-col text-left hover:opacity-80 transition-opacity"
                >
                  <span className="text-sm font-bold text-violet-400">{symbol}</span>
                  <span className="text-xs text-gray-500 truncate max-w-[160px]">{name}</span>
                </button>

                <span className="text-sm font-semibold text-gray-200 text-right">{totalShares}</span>
                <span className="text-sm text-gray-400 text-right">${avgBuyPrice.toFixed(2)}</span>

                {currentPrice !== null ? (
                  <span className="text-sm font-semibold text-gray-200 text-right">${currentPrice.toFixed(2)}</span>
                ) : (
                  <div className="h-4 w-14 bg-[#2a2a4a] rounded animate-pulse justify-self-end" />
                )}

                <span className="text-sm text-gray-400 text-right">${totalLotInvested.toFixed(2)}</span>

                {pnl !== null && pnlPct !== null ? (
                  <div className="flex flex-col items-end">
                    <span className={`text-sm font-semibold ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
                      {positive ? '+' : ''}${pnl.toFixed(2)}
                    </span>
                    <span className={`text-[10px] opacity-70 ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
                      {positive ? '▲' : '▼'} {Math.abs(pnlPct).toFixed(2)}%
                    </span>
                  </div>
                ) : (
                  <div className="h-8 w-16 bg-[#2a2a4a] rounded animate-pulse justify-self-end" />
                )}

                {/* remove — only show for single-lot symbols */}
                {lots.length === 1 ? (
                  <button
                    onClick={() => onRemoveLot(lots[0].id)}
                    className="w-6 h-6 flex items-center justify-center text-gray-700 hover:text-red-400 transition-colors shrink-0"
                    title="Remove lot"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" />
                      <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" />
                    </svg>
                  </button>
                ) : (
                  <div className="w-6" />
                )}
              </div>

              {/* Individual lot sub-rows */}
              {lots.length > 1 && (
                <ul className="bg-[#13132a] border-t border-[#2a2a4a]">
                  {lots.map((h, idx) => {
                    const lotInvested = h.buyPrice * h.quantity;
                    const lotCurrent = currentPrice !== null ? currentPrice * h.quantity : null;
                    const lotPnl = lotCurrent !== null ? lotCurrent - lotInvested : null;
                    const lotPnlPct = lotPnl !== null ? (lotPnl / lotInvested) * 100 : null;
                    const lotPositive = lotPnl !== null ? lotPnl >= 0 : null;
                    const date = new Date(h.addedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' });
                    return (
                      <li key={h.id} className="grid grid-cols-[1fr_auto_auto_auto_auto_auto_auto] gap-3 items-center pl-10 pr-5 py-2.5 border-b border-[#1e1e35] last:border-0 hover:bg-[#16163a] transition-colors">
                        <span className="text-xs text-gray-600">
                          Lot {idx + 1} <span className="text-gray-700">· {date}</span>
                        </span>

                        <span className="text-xs text-gray-400 text-right">{h.quantity}</span>
                        <span className="text-xs text-gray-400 text-right">${h.buyPrice.toFixed(2)}</span>
                        <span className="text-xs text-gray-600 text-right">—</span>
                        <span className="text-xs text-gray-400 text-right">${lotInvested.toFixed(2)}</span>

                        {lotPnl !== null && lotPnlPct !== null ? (
                          <div className="flex flex-col items-end">
                            <span className={`text-xs font-semibold ${lotPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                              {lotPositive ? '+' : ''}${lotPnl.toFixed(2)}
                            </span>
                            <span className={`text-[10px] opacity-60 ${lotPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                              {lotPositive ? '▲' : '▼'} {Math.abs(lotPnlPct).toFixed(2)}%
                            </span>
                          </div>
                        ) : (
                          <div className="h-6 w-14 bg-[#2a2a4a] rounded animate-pulse justify-self-end" />
                        )}

                        <button
                          onClick={() => onRemoveLot(h.id)}
                          className="w-6 h-6 flex items-center justify-center text-gray-700 hover:text-red-400 transition-colors shrink-0"
                          title="Remove this lot"
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" />
                            <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" />
                          </svg>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

