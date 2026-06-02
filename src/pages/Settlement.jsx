import React, { useState } from 'react'
import { useBusiness } from '../context/BusinessContext'
import { fmtAED, fmt } from '../utils/format'
import { format, parseISO } from 'date-fns'
import { Plus, Trash2, ArrowUpRight, ArrowDownLeft, Wallet, AlertTriangle } from 'lucide-react'

const SETTLEMENT_TYPES = ['Cash Withdrawal', 'Bank Deposit', 'Owner Draw', 'Supplier Payment', 'Loan Repayment', 'Petty Cash', 'Other']

const emptyForm = { date: new Date().toISOString().slice(0, 10), type: 'Cash Withdrawal', amount: '', description: '', paidTo: '' }

export default function Settlement() {
  const { settlements, addSettlement, deleteSettlement, stats, entries } = useBusiness()
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!form.date) e.date = 'Required'
    if (!form.amount || isNaN(form.amount) || parseFloat(form.amount) <= 0) e.amount = 'Enter valid amount'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    addSettlement({ ...form, amount: parseFloat(form.amount) })
    setForm(emptyForm)
    setShowForm(false)
    setErrors({})
  }

  const totalSettled = settlements.reduce((s, x) => s + x.amount, 0)
  const netBalance = (stats.closingBalance || 0) - totalSettled

  const lastBalance = entries.length ? entries[entries.length - 1].closingBalance : 0

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">Settlement</h1>
          <p className="text-sm font-body text-stone-500 mt-1">Track cash movements and settlements</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setShowForm(!showForm)}>
          <Plus size={15} />
          New Settlement
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Wallet size={15} className="text-brand-400" />
            <p className="text-xs font-display font-medium text-stone-500 uppercase tracking-wider">Closing Balance</p>
          </div>
          <p className="stat-value text-brand-300">{fmtAED(lastBalance)}</p>
          <p className="stat-label">Current cash on hand</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <ArrowUpRight size={15} className="text-red-400" />
            <p className="text-xs font-display font-medium text-stone-500 uppercase tracking-wider">Total Settled</p>
          </div>
          <p className="stat-value text-red-400">{fmtAED(totalSettled)}</p>
          <p className="stat-label">{settlements.length} transactions</p>
        </div>
        <div className={`card p-5 ${netBalance < 0 ? 'border-red-500/20 bg-red-950/10' : ''}`}>
          <div className="flex items-center gap-2 mb-3">
            {netBalance < 0
              ? <AlertTriangle size={15} className="text-red-400" />
              : <ArrowDownLeft size={15} className="text-emerald-400" />}
            <p className="text-xs font-display font-medium text-stone-500 uppercase tracking-wider">Net Remaining</p>
          </div>
          <p className={`stat-value ${netBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmtAED(netBalance)}</p>
          <p className="stat-label">{netBalance < 0 ? 'Over-settled!' : 'Available balance'}</p>
        </div>
      </div>

      {/* Settlement form */}
      {showForm && (
        <div className="card-glow p-6 animate-slide-in">
          <h2 className="font-display font-semibold text-stone-200 mb-5">New Settlement</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="label">Date</label>
              <input type="date" className="input-field" value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              {errors.date && <p className="text-xs text-red-400 mt-1">{errors.date}</p>}
            </div>
            <div>
              <label className="label">Type</label>
              <select className="select-field" value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {SETTLEMENT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Amount (AED)</label>
              <input type="number" className="input-field" placeholder="0.00" value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
              {errors.amount && <p className="text-xs text-red-400 mt-1">{errors.amount}</p>}
            </div>
            <div>
              <label className="label">Paid To / Received From</label>
              <input type="text" className="input-field" placeholder="Name..." value={form.paidTo}
                onChange={e => setForm(f => ({ ...f, paidTo: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Description</label>
              <input type="text" className="input-field" placeholder="Details..." value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button className="btn-primary" onClick={handleSubmit}>Save Settlement</button>
            <button className="btn-ghost" onClick={() => { setShowForm(false); setErrors({}) }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Settlements table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-800/50">
          <h2 className="font-display font-semibold text-stone-300">Settlement History</h2>
        </div>
        {settlements.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-stone-600 font-body">No settlements recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-800/60">
                  <th className="table-th">Date</th>
                  <th className="table-th">Type</th>
                  <th className="table-th hidden sm:table-cell">Paid To</th>
                  <th className="table-th hidden md:table-cell">Description</th>
                  <th className="table-th text-right">Amount</th>
                  <th className="table-th text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {[...settlements].reverse().map(s => (
                  <tr key={s.id} className="table-row">
                    <td className="table-td">{format(parseISO(s.date), 'MMM d, yyyy')}</td>
                    <td className="table-td">
                      <span className="badge-amber">{s.type}</span>
                    </td>
                    <td className="table-td hidden sm:table-cell text-stone-400">{s.paidTo || '—'}</td>
                    <td className="table-td hidden md:table-cell text-stone-500 text-xs">{s.description || '—'}</td>
                    <td className="table-td text-right font-mono font-medium text-red-400">{fmtAED(s.amount)}</td>
                    <td className="table-td text-center">
                      <button
                        className="p-1.5 rounded-lg hover:bg-red-900/30 text-stone-500 hover:text-red-400 transition-colors"
                        onClick={() => deleteSettlement(s.id)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-stone-700/50 bg-stone-900/20">
                  <td colSpan={4} className="table-td font-display font-semibold text-stone-300">Total</td>
                  <td className="table-td text-right font-display font-bold text-red-400">{fmtAED(totalSettled)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
