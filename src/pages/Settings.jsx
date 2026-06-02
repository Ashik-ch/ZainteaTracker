import React, { useState } from 'react'
import { useBusiness } from '../context/BusinessContext'
import { fmtAED } from '../utils/format'
import { Download, Trash2, AlertTriangle, CheckCircle, Upload } from 'lucide-react'
import { format, parseISO } from 'date-fns'

export default function Settings() {
  const { entries, settlements, stats } = useBusiness()
  const [confirmReset, setConfirmReset] = useState(false)
  const [msg, setMsg] = useState('')

  const exportJSON = () => {
    const data = { exportDate: new Date().toISOString(), summary: stats, entries, settlements }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `zaintea-export-${format(new Date(), 'yyyy-MM-dd')}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMsg('Data exported successfully!')
    setTimeout(() => setMsg(''), 3000)
  }

  const exportCSV = () => {
    const headers = ['Date','Sales','Card','Cash','Expense','Profit','Opening Balance','Closing Balance','Notes']
    const rows = entries.map(e => [
      e.date, e.sales, e.card, e.cash, e.expense,
      (e.sales - e.expense).toFixed(2),
      e.openingBalance, e.closingBalance, e.notes || ''
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `zaintea-${format(new Date(), 'yyyy-MM')}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setMsg('CSV exported!')
    setTimeout(() => setMsg(''), 3000)
  }

  const handleReset = () => {
    localStorage.removeItem('zaintea_entries')
    localStorage.removeItem('zaintea_settlements')
    window.location.reload()
  }

  return (
    <div className="space-y-6 animate-fade-up max-w-2xl">
      <div>
        <h1 className="section-title">Settings</h1>
        <p className="text-sm font-body text-stone-500 mt-1">Manage your data and preferences</p>
      </div>

      {msg && (
        <div className="flex items-center gap-2 bg-emerald-900/20 border border-emerald-700/30 text-emerald-400 px-4 py-3 rounded-xl text-sm font-body">
          <CheckCircle size={15} /> {msg}
        </div>
      )}

      {/* Data summary */}
      <div className="card p-6">
        <h2 className="font-display font-semibold text-stone-200 mb-4">Data Summary</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total Entries', value: entries.length },
            { label: 'Settlements', value: settlements.length },
            { label: 'Total Sales', value: fmtAED(stats.totalSales, true) },
            { label: 'Total Expenses', value: fmtAED(stats.totalExpense, true) },
            { label: 'Net Profit', value: fmtAED(stats.totalProfit, true) },
            { label: 'Closing Balance', value: fmtAED(stats.closingBalance, true) },
          ].map(({ label, value }) => (
            <div key={label} className="bg-stone-800/30 rounded-xl p-3">
              <p className="text-xs font-body text-stone-600 mb-1">{label}</p>
              <p className="font-display font-semibold text-stone-200 text-sm">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Export */}
      <div className="card p-6">
        <h2 className="font-display font-semibold text-stone-200 mb-2">Export Data</h2>
        <p className="text-sm font-body text-stone-500 mb-4">Download your business data for backup or analysis in Excel/Google Sheets.</p>
        <div className="flex flex-wrap gap-3">
          <button className="btn-primary flex items-center gap-2" onClick={exportCSV}>
            <Download size={14} /> Export CSV
          </button>
          <button className="btn-ghost border border-stone-700 flex items-center gap-2" onClick={exportJSON}>
            <Download size={14} /> Export JSON
          </button>
        </div>
      </div>

      {/* About */}
      <div className="card p-6">
        <h2 className="font-display font-semibold text-stone-200 mb-2">About</h2>
        <div className="space-y-2 text-sm font-body text-stone-500">
          <p><span className="text-stone-400">App:</span> ZAINTEA Business Tracker v1.0</p>
          <p><span className="text-stone-400">Data storage:</span> Local browser storage (private to this device)</p>
          <p><span className="text-stone-400">Framework:</span> React + Vite + Tailwind CSS</p>
        </div>
      </div>

      {/* Danger zone */}
      <div className="card p-6 border-red-900/30">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle size={15} className="text-red-400" />
          <h2 className="font-display font-semibold text-red-400">Danger Zone</h2>
        </div>
        <p className="text-sm font-body text-stone-500 mb-4">
          Resetting will permanently delete all entries and settlements. This cannot be undone. The May seed data will be restored.
        </p>
        {!confirmReset ? (
          <button
            className="text-sm font-body text-red-400 border border-red-800/50 px-4 py-2 rounded-xl hover:bg-red-900/20 transition-colors flex items-center gap-2"
            onClick={() => setConfirmReset(true)}
          >
            <Trash2 size={14} /> Reset All Data
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button
              className="text-sm font-body bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded-xl transition-colors"
              onClick={handleReset}
            >
              Yes, Reset Everything
            </button>
            <button className="btn-ghost" onClick={() => setConfirmReset(false)}>Cancel</button>
          </div>
        )}
      </div>
    </div>
  )
}
