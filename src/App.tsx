import { useState, useEffect } from 'react'
import StockSearch from './components/StockSearch'
import StockDashboard from './components/StockDashboard'
import DefaultDashboard from './components/DefaultDashboard'
import NavBar, { type Page } from './components/NavBar'
import FavouritesPage from './pages/FavouritesPage'
import PortfolioPage from './pages/PortfolioPage'
import ThemeToggle from './components/ThemeToggle'
import { useFavorites } from './hooks/useFavorites'
import { usePortfolio } from './hooks/usePortfolio'

function App() {
  const [page, setPage] = useState<Page>('dashboard')
  const [selected, setSelected] = useState<{ symbol: string; name: string } | null>(null)
  const { favorites, isFavorite, toggleFavorite, removeFavorite } = useFavorites()
  const { holdings, addHolding, removeHolding, getHoldingsForSymbol } = usePortfolio()
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem('theme')
    return stored ? stored === 'dark' : true // default dark
  })

  useEffect(() => {
    const html = document.documentElement
    if (isDark) {
      html.classList.remove('light')
    } else {
      html.classList.add('light')
    }
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }, [isDark])

  function handleSelectStock(symbol: string, name: string) {
    setSelected({ symbol, name })
    setPage('dashboard')
  }

  return (
    <div className="min-h-screen bg-[#0d0d1a] flex flex-col items-center px-4 pb-20">
      <header className="w-full max-w-full flex items-center justify-between pt-8 pb-4 px-0">
        <div className="flex-1" />
        <div className="text-center flex-1">
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-1">Stock Dashboard</h1>
          <p className="text-gray-500 text-base">Search any stock and get a real-time quote</p>
        </div>
        <div className="flex-1 flex justify-end gap-2">
          <ThemeToggle isDark={isDark} onToggle={() => setIsDark((d) => !d)} />
        </div>
      </header>

      <main className="w-full max-w-7xl">
        {/* Navigation */}
        <div className="flex justify-center mb-6">
          <NavBar
            current={page}
            favCount={favorites.length}
            portfolioCount={holdings.length}
            onNavigate={(p) => {
              setPage(p)
              setSelected(null)
            }}
          />
        </div>

        {/* Dashboard page */}
        {page === 'dashboard' && (
          <>
            <div className="max-w-xl mx-auto">
              <StockSearch
                initialQuery={selected ? selected.symbol : ''}
                onSelect={handleSelectStock}
              />
            </div>
            {selected
              ? <StockDashboard
                  symbol={selected.symbol}
                  companyName={selected.name}
                  isFavorite={isFavorite(selected.symbol)}
                  onToggleFavorite={() => selected && toggleFavorite(selected)}
                  holdingsCount={getHoldingsForSymbol(selected.symbol).length}
                  onSaveHolding={(buyPrice, quantity) =>
                    selected && addHolding({ symbol: selected.symbol, name: selected.name, buyPrice, quantity })
                  }
                />
              : <DefaultDashboard onSelect={handleSelectStock} />
            }
          </>
        )}

        {/* Favourites page */}
        {page === 'favourites' && (
          <FavouritesPage
            favorites={favorites}
            onSelect={handleSelectStock}
            onRemove={removeFavorite}
          />
        )}

        {/* Portfolio page */}
        {page === 'portfolio' && (
          <PortfolioPage
            holdings={holdings}
            onSelect={handleSelectStock}
            onRemoveLot={removeHolding}
          />
        )}
      </main>
    </div>
  )
}

export default App
