import { useState } from 'react'
import StockSearch from './components/StockSearch'
import StockDashboard from './components/StockDashboard'
import DefaultDashboard from './components/DefaultDashboard'

function App() {
  const [selected, setSelected] = useState<{ symbol: string; name: string } | null>(null)

  return (
    <div className="min-h-screen bg-[#0d0d1a] flex flex-col items-center px-4 pb-20">
      <header className="text-center py-14 px-4">
        <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">📈 StockMarket Dashboard</h1>
        <p className="text-gray-500 text-base">Search any stock and get a real-time quote</p>
      </header>

      <main className="w-full max-w-4xl">
        <div className="max-w-xl mx-auto">
          <StockSearch onSelect={(symbol, name) => setSelected({ symbol, name })} />
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
