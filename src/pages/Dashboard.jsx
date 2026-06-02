import React, { useMemo } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend
} from 'recharts'
import {
  DollarSign, TrendingUp, TrendingDown, Wallet,
  Star, AlertCircle, ArrowUp, ArrowDown
} from 'lucide-react'
import { useBusiness } from '../context/BusinessContext'
import StatCard from '../components/StatCard'
import { fmtAED, fmtPct, fmt } from '../utils/format'
import { format, parseISO } from 'date-fns'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1c1812] border border-stone-700/60 rounded-xl p-3 shadow-xl text-xs font-body">
      <p className="text-stone-400 mb-2">Day {label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-stone-400">{p.name}:</span>
          <span className="text-stone-100 font-medium">AED {fmt(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { entries, stats, goals } = useBusiness()

  const chartData = useMemo(() => entries.map(e => ({
    day: format(parseISO(e.date), 'd'),
    date: format(parseISO(e.date), 'MMM d'),
    sales: e.sales,
    expense: e.expense,
    profit: parseFloat((e.sales - e.expense).toFixed(2)),
    balance: e.closingBalance,
  })), [entries])

  const recentEntries = [...entries].reverse().slice(0, 7)

  const salesVsTarget = stats.avgDailySales
    ? ((stats.avgDailySales / goals.dailySalesTarget) * 100).toFixed(0)
    : 0
  const profitVsTarget = stats.totalProfit
    ? ((stats.totalProfit / goals.monthlyProfitTarget) * 100).toFixed(0)
    : 0

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="section-title text-2xl">Overview</h1>
          <p className="text-sm font-body text-stone-500 mt-1">
            {entries.length} days tracked · Last updated {entries.length ? format(parseISO(entries[entries.length - 1].date), 'MMM d, yyyy') : '—'}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs font-body text-stone-500 bg-stone-800/40 px-3 py-2 rounded-xl border border-stone-700/40">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-slow" />
          Live tracking
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Total Sales"
          value={fmtAED(stats.totalSales, true)}
          sub={`Avg ${fmtAED(stats.avgDailySales, true)}/day`}
          icon={TrendingUp}
          delay={0}
        />
        <StatCard
          label="Total Expenses"
          value={fmtAED(stats.totalExpense, true)}
          sub={`Ratio ${fmtPct(stats.expenseRatio)}`}
          icon={TrendingDown}
          delay={60}
        />
        <StatCard
          label="Net Profit"
          value={fmtAED(stats.totalProfit, true)}
          sub={`Margin ${fmtPct(stats.profitMargin)}`}
          icon={DollarSign}
          accent
          delay={120}
        />
        <StatCard
          label="Closing Balance"
          value={fmtAED(stats.closingBalance, true)}
          sub="Cumulative cash"
          icon={Wallet}
          delay={180}
        />
      </div>

      {/* Target progress */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-display font-medium text-stone-500 uppercase tracking-wider">Daily Sales vs Target</p>
            <span className={salesVsTarget >= 100 ? 'badge-green' : 'badge-amber'}>
              {salesVsTarget}%
            </span>
          </div>
          <div className="w-full bg-stone-800 rounded-full h-2 mb-2">
            <div
              className="bg-brand-500 h-2 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(salesVsTarget, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs font-body text-stone-600">
            <span>Avg {fmtAED(stats.avgDailySales, true)}</span>
            <span>Target {fmtAED(goals.dailySalesTarget, true)}</span>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-display font-medium text-stone-500 uppercase tracking-wider">Monthly Profit vs Target</p>
            <span className={profitVsTarget >= 100 ? 'badge-green' : 'badge-amber'}>
              {profitVsTarget}%
            </span>
          </div>
          <div className="w-full bg-stone-800 rounded-full h-2 mb-2">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(profitVsTarget, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs font-body text-stone-600">
            <span>Actual {fmtAED(stats.totalProfit, true)}</span>
            <span>Target {fmtAED(goals.monthlyProfitTarget, true)}</span>
          </div>
        </div>
      </div>

      {/* Sales chart */}
      <div className="card p-5">
        <h2 className="text-sm font-display font-semibold text-stone-300 mb-4">Sales vs Expenses — Daily</h2>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="gSales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#d4740a" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#d4740a" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#292419" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#57534e', fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#57534e', fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} tickFormatter={v => 'AED ' + (v/1000).toFixed(0) + 'k'} width={60} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="sales" name="Sales" stroke="#d4740a" strokeWidth={2} fill="url(#gSales)" dot={false} />
            <Area type="monotone" dataKey="expense" name="Expense" stroke="#ef4444" strokeWidth={1.5} fill="url(#gExpense)" dot={false} strokeDasharray="4 2" />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex gap-5 mt-3 text-xs font-body text-stone-600">
          <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-brand-500 inline-block" /> Sales</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-red-500 inline-block" style={{ borderTop: '1.5px dashed' }} /> Expense</span>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Profit bar */}
        <div className="card p-5">
          <h2 className="text-sm font-display font-semibold text-stone-300 mb-4">Daily Profit</h2>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#292419" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#57534e' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#57534e' }} axisLine={false} tickLine={false} width={50} tickFormatter={v => (v/1000).toFixed(0) + 'k'} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="profit" name="Profit" fill="#1D9E75" radius={[3, 3, 0, 0]} maxBarSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent entries */}
        <div className="card p-5">
          <h2 className="text-sm font-display font-semibold text-stone-300 mb-4">Recent Entries</h2>
          <div className="space-y-2">
            {recentEntries.map(e => {
              const profit = e.sales - e.expense
              return (
                <div key={e.id} className="flex items-center justify-between py-2 border-b border-stone-800/50 last:border-0">
                  <div>
                    <p className="text-xs font-display text-stone-300">{format(parseISO(e.date), 'EEE, MMM d')}</p>
                    <p className="text-xs font-body text-stone-600 mt-0.5">{fmtAED(e.sales)} sales</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-display font-semibold ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {profit >= 0 ? '+' : ''}{fmtAED(profit, true)}
                    </p>
                    <p className="text-xs font-body text-stone-600 mt-0.5">Balance {fmtAED(e.closingBalance, true)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Best/Worst day */}
      {stats.bestDay && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="card p-5 border-emerald-500/20 bg-emerald-950/10">
            <div className="flex items-center gap-2 mb-2">
              <Star size={14} className="text-emerald-400" />
              <p className="text-xs font-display font-medium text-emerald-400 uppercase tracking-wider">Best Day</p>
            </div>
            <p className="font-display font-bold text-xl text-stone-100">{fmtAED(stats.bestDay.sales)}</p>
            <p className="text-xs font-body text-stone-500 mt-1">{format(parseISO(stats.bestDay.date), 'EEEE, MMM d')}</p>
          </div>
          <div className="card p-5 border-red-500/20 bg-red-950/10">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={14} className="text-red-400" />
              <p className="text-xs font-display font-medium text-red-400 uppercase tracking-wider">Lowest Day</p>
            </div>
            <p className="font-display font-bold text-xl text-stone-100">{fmtAED(stats.worstDay.sales)}</p>
            <p className="text-xs font-body text-stone-500 mt-1">{format(parseISO(stats.worstDay.date), 'EEEE, MMM d')}</p>
          </div>
        </div>
      )}
    </div>
  )
}
