import { useState, useEffect } from 'react';
import { getCompanyProfile, type CompanyProfile } from '../api/finnhub';

interface Props {
  symbol: string;
}

function fmtMarketCap(mc: number | null): string {
  if (mc === null) return '—';
  if (mc >= 1_000_000) return `$${(mc / 1_000_000).toFixed(2)}T`;
  if (mc >= 1_000) return `$${(mc / 1_000).toFixed(2)}B`;
  return `$${mc.toFixed(0)}M`;
}

export default function CompanyProfile({ symbol }: Props) {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (!symbol) return;
    setProfile(null);
    setImgError(false);
    getCompanyProfile(symbol).then(setProfile).catch(() => {});
  }, [symbol]);

  if (!profile || (!profile.name && !profile.industry)) return null;

  const pills = [
    profile.exchange,
    profile.industry,
    profile.country,
    profile.currency,
  ].filter(Boolean);

  return (
    <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-2xl p-6 shadow-xl">
      <div className="flex items-start gap-4">

        {/* Logo */}
        {profile.logo && !imgError ? (
          <img
            src={profile.logo}
            alt={profile.name}
            onError={() => setImgError(true)}
            className="w-14 h-14 rounded-xl object-contain bg-white p-1.5 flex-shrink-0"
          />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-[#2a2a4a] flex items-center justify-center flex-shrink-0 text-lg font-bold text-gray-500">
            {symbol.slice(0, 2)}
          </div>
        )}

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="text-base font-bold text-white leading-tight">{profile.name || symbol}</h3>
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-violet-400 hover:text-violet-300 transition-colors"
              >
                ↗ Website
              </a>
            )}
          </div>

          {/* Pills */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {pills.map((p) => (
              <span
                key={p}
                className="text-[11px] px-2 py-0.5 rounded-full bg-[#2a2a4a] text-gray-400 border border-[#3a3a5a]"
              >
                {p}
              </span>
            ))}
          </div>
        </div>

        {/* Right: Market Cap + IPO */}
        <div className="hidden sm:flex flex-col items-end gap-1 flex-shrink-0">
          {profile.marketCap !== null && (
            <div className="text-right">
              <span className="block text-[10px] uppercase tracking-widest text-gray-600">Market Cap</span>
              <span className="text-sm font-semibold text-gray-200">{fmtMarketCap(profile.marketCap)}</span>
            </div>
          )}
          {profile.ipo && (
            <div className="text-right">
              <span className="block text-[10px] uppercase tracking-widest text-gray-600">IPO</span>
              <span className="text-sm font-semibold text-gray-200">{profile.ipo}</span>
            </div>
          )}
        </div>

      </div>

      {/* Mobile: Market Cap + IPO below */}
      {(profile.marketCap !== null || profile.ipo) && (
        <div className="flex gap-6 mt-4 pt-4 border-t border-[#2a2a4a] sm:hidden">
          {profile.marketCap !== null && (
            <div>
              <span className="block text-[10px] uppercase tracking-widest text-gray-600">Market Cap</span>
              <span className="text-sm font-semibold text-gray-200">{fmtMarketCap(profile.marketCap)}</span>
            </div>
          )}
          {profile.ipo && (
            <div>
              <span className="block text-[10px] uppercase tracking-widest text-gray-600">IPO</span>
              <span className="text-sm font-semibold text-gray-200">{profile.ipo}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
