export type Page = 'dashboard' | 'favourites' | 'portfolio';

interface Props {
  current: Page;
  favCount: number;
  portfolioCount: number;
  onNavigate: (page: Page) => void;
}

const TABS: { id: Page; label: string; icon: React.ReactNode }[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    id: 'favourites' as Page,
    label: 'Favourites',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
  },
  {
    id: 'portfolio' as Page,
    label: 'Portfolio',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M2 12l10-10 10 10" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 10v10h6v-6h4v6h6V10" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function NavBar({ current, favCount, portfolioCount, onNavigate }: Props) {
  return (
    <nav className="flex items-center gap-1 bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl p-1">
      {TABS.map(({ id, label, icon }) => {
        const active = current === id;
        return (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              active
                ? 'text-white border'
                : 'text-gray-400 hover:text-gray-200 hover:bg-[#22223a] border border-transparent'
            }`}
          >
            <span className={active ? 'text-white' : id === 'favourites' ? 'text-yellow-400' : 'text-gray-500'}>
              {icon}
            </span>
            {label}
            {id === 'favourites' && favCount > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
                active ? 'bg-white/20 text-white' : 'bg-yellow-400/20 text-yellow-400'
              }`}>
                {favCount}
              </span>
            )}
            {id === 'portfolio' && portfolioCount > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
                active ? 'bg-white/20 text-white' : 'bg-emerald-400/20 text-emerald-400'
              }`}>
                {portfolioCount}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
