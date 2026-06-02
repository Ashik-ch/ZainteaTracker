import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { BusinessProvider } from './context/BusinessContext'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import DailyEntry from './pages/DailyEntry'
import Cashout from './pages/Cashout'
import Analytics from './pages/Analytics'
import Settlement from './pages/Settlement'
import Goals from './pages/Goals'
import Settings from './pages/Settings'

function Layout({ children }) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="lg:ml-56 pt-16 lg:pt-0 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BusinessProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/daily" element={<DailyEntry />} />
          <Route path="/cashout" element={<Cashout />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settlement" element={<Settlement />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </BusinessProvider>
  )
}
