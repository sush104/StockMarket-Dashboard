import { useState, useEffect } from 'react'
import StockSearch from './components/StockSearch'
import StockDashboard from './components/StockDashboard'
import DefaultDashboard from './components/DefaultDashboard'
import ThemeToggle from './components/ThemeToggle'

function App() {
  const [selected, setSelected] = useState<{ symbol: string; name: string } | null>(null)
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

  return (
    <div className="min-h-screen bg-[#0d0d1a] flex flex-col items-center px-4 pb-20">
      <header className="w-full max-w-full flex items-center justify-between pt-8 pb-4 px-0">
        <div className="flex-1" />
        <div className="text-center flex-1">
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-1">Stock Dashboard</h1>
          <p className="text-gray-500 text-base">Search any stock and get a real-time quote</p>
        </div>
        <div className="flex-1 flex justify-end">
          <ThemeToggle isDark={isDark} onToggle={() => setIsDark((d) => !d)} />
        </div>
      </header>

      <main className="w-full max-w-7xl">
        <div className="max-w-xl mx-auto">
          <StockSearch
            initialQuery={selected ? selected.symbol : ''}
            onSelect={(symbol, name) => setSelected({ symbol, name })}
          />
        </div>
        {selected
          ? <StockDashboard symbol={selected.symbol} companyName={selected.name} />
          : <DefaultDashboard onSelect={(symbol, name) => setSelected({ symbol, name })} />
        }
      </main>
    </div>
  )
}

export default App
