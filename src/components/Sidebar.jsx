import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, TrendingUp, ClipboardList,
  ArrowLeftRight, Target, Settings, Menu, X, Wallet,
  Coffee
} from 'lucide-react'
import { clsx } from '../utils/format'

const NAV = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/daily', icon: ClipboardList, label: 'Daily Entry' },
  { path: '/cashout', icon: Wallet, label: 'Cashout' },
  { path: '/analytics', icon: TrendingUp, label: 'Analytics' },
  { path: '/settlement', icon: ArrowLeftRight, label: 'Settlement' },
  { path: '/goals', icon: Target, label: 'Goals & Tips' },
  { path: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const NavContent = () => (
    <nav className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-6 mb-2">
        <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center shadow-lg shadow-brand-900/50">
          <Coffee size={18} className="text-white" />
        </div>
        <div>
          <p className="font-display font-bold text-stone-100 text-lg leading-none">ZAINTEA</p>
          <p className="text-xs font-body text-stone-600 mt-0.5">Business Tracker</p>
        </div>
      </div>

      {/* Links */}
      <div className="flex-1 px-3 space-y-1">
        {NAV.map(({ path, icon: Icon, label }) => (
          <button
            key={path}
            onClick={() => { navigate(path); setMobileOpen(false) }}
            className={clsx('nav-link w-full', location.pathname === path && 'active')}
          >
            <Icon size={16} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-5 border-t border-stone-800/60">
        <p className="text-xs font-body text-stone-700">
          © 2024 ZAINTEA<br />All rights reserved
        </p>
      </div>
    </nav>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 min-h-screen bg-[#111009] border-r border-stone-800/50 fixed top-0 left-0 z-30">
        <NavContent />
      </aside>

      {/* Mobile topbar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[#0f0d0b]/95 backdrop-blur border-b border-stone-800/50 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center">
            <Coffee size={14} className="text-white" />
          </div>
          <span className="font-display font-bold text-stone-100">ZAINTEA</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="btn-ghost p-2">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-30">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute top-0 left-0 w-64 h-full bg-[#111009] border-r border-stone-800/50 pt-14 z-10">
            <NavContent />
          </aside>
        </div>
      )}
    </>
  )
}
