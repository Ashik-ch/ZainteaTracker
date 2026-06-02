import React, { useMemo, useState } from 'react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts'
import { useBusiness } from '../context/BusinessContext'
import { fmtAED, fmtPct, fmt } from '../utils/format'
import { format, parseISO, getDay } from 'date-fns'

const COLORS = ['#d4740a','#1D9E75','#378ADD','#7F77DD','#D4537E','#EF9F27','#5DCAA5','#E24B4A','#639922','#888780','#D85A30','#0F6E56']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1c1812] border border-stone-700/60 rounded-xl p-3 shadow-xl text-xs font-body">
      <p className="text-stone-400 mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color || p.fill }} />
          <span className="text-stone-400">{p.name}:</span>
          <span className="text-stone-100 font-medium">AED {fmt(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

export default function Analytics() {
  const { entries } = useBusiness()
  const [view, setView] = useState('weekly')

  // Sales by day of week
  const byDOW = useMemo(() => {
    const acc = Array(7).fill(null).map((_, i) => ({ day: DAYS[i], total: 0, count: 0 }))
    entries.forEach(e => {
      const dow = getDay(parseISO(e.date))
      acc[dow].total += e.sales
      acc[dow].count++
    })
    return acc.map(d => ({ ...d, avg: d.count ? parseFloat((d.total / d.count).toFixed(2)) : 0 }))
  }, [entries])

  // Rolling 7-day profit
  const rolling = useMemo(() => {
    return entries.map((e, i) => {
      const slice = entries.slice(Math.max(0, i - 6), i + 1)
      const avg = slice.reduce((s, x) => s + (x.sales - x.expense), 0) / slice.length
      return {
        day: format(parseISO(e.date), 'd'),
        profit: parseFloat((e.sales - e.expense).toFixed(2)),
        rolling7: parseFloat(avg.toFixed(2)),
      }
    })
  }, [entries])

  // Expense breakdown aggregated
  const expenseData = useMemo(() => {
    const agg = {}
    entries.forEach(e => {
      Object.entries(e.expenseBreakdown || {}).forEach(([cat, val]) => {
        if (val) agg[cat] = (agg[cat] || 0) + val
      })
    })
    const total = Object.values(agg).reduce((s, v) => s + v, 0) || 1
    return Object.entries(agg)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)), pct: ((value / total) * 100).toFixed(1) }))
  }, [entries])

  // Cumulative balance
  const balanceData = useMemo(() => entries.map((e, i) => ({
    day: format(parseISO(e.date), 'd'),
    balance: e.closingBalance,
  })), [entries])

  // Key metrics table
  const metrics = useMemo(() => {
    const sorted = [...entries].sort((a, b) => b.sales - a.sales)
    return {
      top5: sorted.slice(0, 5),
      bottom5: sorted.slice(-5).reverse(),
    }
  }, [entries])

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="section-title">Analytics</h1>
        <p className="text-sm font-body text-stone-500 mt-1">Deep insights from your business data</p>
      </div>

      {/* Sales by day of week */}
      <div className="card p-5">
        <h2 className="text-sm font-display font-semibold text-stone-300 mb-4">Average Sales by Day of Week</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={byDOW} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#292419" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#78716c', fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#57534e' }} axisLine={false} tickLine={false} tickFormatter={v => 'AED ' + (v/1000).toFixed(1) + 'k'} width={60} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="avg" name="Avg Sales" fill="#d4740a" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Rolling profit */}
      <div className="card p-5">
        <h2 className="text-sm font-display font-semibold text-stone-300 mb-1">Profit Trend</h2>
        <p className="text-xs font-body text-stone-600 mb-4">Daily profit vs 7-day rolling average</p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={rolling} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#292419" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#57534e' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#57534e' }} axisLine={false} tickLine={false} tickFormatter={v => (v/1000).toFixed(0) + 'k'} width={40} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="profit" name="Daily Profit" stroke="#1D9E75" strokeWidth={1.5} dot={false} strokeOpacity={0.7} />
            <Line type="monotone" dataKey="rolling7" name="7-day Avg" stroke="#d4740a" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex gap-5 mt-3 text-xs font-body text-stone-600">
          <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-emerald-500 inline-block" /> Daily</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-brand-500 inline-block" /> 7-day avg</span>
        </div>
      </div>

      {/* Cumulative balance */}
      <div className="card p-5">
        <h2 className="text-sm font-display font-semibold text-stone-300 mb-4">Cumulative Balance Growth</h2>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={balanceData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#292419" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#57534e' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#57534e' }} axisLine={false} tickLine={false} tickFormatter={v => 'AED ' + (v/1000).toFixed(0) + 'k'} width={65} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="balance" name="Balance" stroke="#378ADD" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Expense pie if breakdown exists */}
      {expenseData.length > 0 ? (
        <div className="card p-5">
          <h2 className="text-sm font-display font-semibold text-stone-300 mb-4">Expense Category Breakdown</h2>
          <div className="flex flex-col lg:flex-row gap-6 items-center">
            <div className="flex-shrink-0">
              <ResponsiveContainer width={220} height={220}>
                <PieChart>
                  <Pie data={expenseData} cx={105} cy={105} innerRadius={55} outerRadius={95}
                    dataKey="value" paddingAngle={2}>
                    {expenseData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => ['AED ' + fmt(v), 'Amount']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {expenseData.map((item, i) => (
                <div key={item.name} className="flex items-center gap-2 text-xs font-body">
                  <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-stone-400 flex-1 truncate">{item.name}</span>
                  <span className="text-stone-300 font-medium">{fmtAED(item.value, true)}</span>
                  <span className="text-stone-600">({item.pct}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="card p-8 text-center">
          <p className="text-stone-600 font-body text-sm">Add expense breakdowns in Daily Entry to see category analysis here.</p>
        </div>
      )}

      {/* Top/Bottom days */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h2 className="text-sm font-display font-semibold text-stone-300 mb-4">Top 5 Sales Days</h2>
          <div className="space-y-2">
            {metrics.top5.map((e, i) => (
              <div key={e.id} className="flex items-center gap-3 text-sm font-body">
                <span className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-xs font-display flex-shrink-0">{i+1}</span>
                <span className="text-stone-400">{format(parseISO(e.date), 'EEE MMM d')}</span>
                <span className="ml-auto text-stone-200 font-medium">{fmtAED(e.sales)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-5">
          <h2 className="text-sm font-display font-semibold text-stone-300 mb-4">Bottom 5 Sales Days</h2>
          <div className="space-y-2">
            {metrics.bottom5.map((e, i) => (
              <div key={e.id} className="flex items-center gap-3 text-sm font-body">
                <span className="w-5 h-5 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center text-xs font-display flex-shrink-0">{i+1}</span>
                <span className="text-stone-400">{format(parseISO(e.date), 'EEE MMM d')}</span>
                <span className="ml-auto text-red-400 font-medium">{fmtAED(e.sales)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
