import { useState, useEffect, useRef } from 'react';
import { createChart, ColorType, CandlestickSeries } from 'lightweight-charts';
import { getCandles, type CandlePoint } from '../api/finnhub';

interface Props {
  symbol: string;
}

const RANGES = [
  { label: '1W', days: 7 },
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
];

export default function PriceChart({ symbol }: Props) {
  const [candles, setCandles] = useState<CandlePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [range, setRange] = useState(RANGES[1]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch candle data from Finnhub
  useEffect(() => {
    setLoading(true);
    setError(false);
    setCandles([]);
    getCandles(symbol, range.days)
      .then((data) => {
        setCandles(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [symbol, range]);

  // Build / rebuild chart when data arrives
  useEffect(() => {
    if (!containerRef.current || candles.length === 0) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#6b7280',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: '#1f1f3a' },
        horzLines: { color: '#1f1f3a' },
      },
      width: containerRef.current.clientWidth,
      height: 210,
      timeScale: {
        borderColor: '#2a2a4a',
        timeVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      rightPriceScale: {
        borderColor: '#2a2a4a',
      },
      crosshair: {
        vertLine: { color: '#4c4c7a', labelBackgroundColor: '#2a2a4a' },
        horzLine: { color: '#4c4c7a', labelBackgroundColor: '#2a2a4a' },
      },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#34d399',
      downColor: '#f87171',
      borderVisible: false,
      wickUpColor: '#34d399',
      wickDownColor: '#f87171',
    });

    series.setData(
      candles.map((c) => ({
        time: c.time as `${number}-${number}-${number}`,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }))
    );

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [candles]);

  return (
    <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-2xl p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-300">Price Chart</span>
          <span className="text-[10px] text-gray-600 bg-[#2a2a4a] px-2 py-0.5 rounded-full">OHLC Candles</span>
        </div>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r.label}
              onClick={() => setRange(r)}
              className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors ${
                range.label === r.label
                  ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                  : 'text-gray-600 hover:text-gray-400'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart area */}
      <div className="relative" style={{ height: 210 }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 text-gray-600 text-sm z-10">
            <span className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            Loading candles…
          </div>
        )}
        {!loading && (error || candles.length === 0) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-gray-700 text-sm z-10">
            <span>No candle data available</span>
            <span className="text-xs text-gray-800">Finnhub free plan may not include this symbol</span>
          </div>
        )}
        <div
          ref={containerRef}
          className="w-full h-full"
          style={{ visibility: !loading && candles.length > 0 ? 'visible' : 'hidden' }}
        />
      </div>

      {/* Legend */}
      {!loading && candles.length > 0 && (
        <div className="flex items-center gap-4 text-[11px] text-gray-600">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-emerald-400" /> Bullish
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-red-400" /> Bearish
          </span>
        </div>
      )}
    </div>
  );
}
