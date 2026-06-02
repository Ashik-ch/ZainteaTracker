import React, { useState } from 'react'
import { useBusiness } from '../context/BusinessContext'
import { fmtAED, fmt } from '../utils/format'
import { format, parseISO } from 'date-fns'
import { Plus, Trash2, Edit2, Check, X, ChevronDown, ChevronUp } from 'lucide-react'

const today = () => new Date().toISOString().slice(0, 10)

const emptyForm = {
  date: today(), sales: '', card: '', expense: '', notes: '',
  expenseBreakdown: {},
}

export default function DailyEntry() {
  const { entries, addEntry, updateEntry, deleteEntry, EXPENSE_CATEGORIES } = useBusiness()
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [showBreakdown, setShowBreakdown] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [errors, setErrors] = useState({})
  const [expandedRow, setExpandedRow] = useState(null)

  const validate = () => {
    const e = {}
    if (!form.date) e.date = 'Required'
    if (!form.sales || isNaN(form.sales)) e.sales = 'Enter a valid number'
    if (!form.expense || isNaN(form.expense)) e.expense = 'Enter a valid number'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    const entry = {
      date: form.date,
      sales: parseFloat(form.sales),
      card: parseFloat(form.card || 0),
      cash: parseFloat(form.sales) - parseFloat(form.card || 0),
      expense: parseFloat(form.expense),
      notes: form.notes,
      expenseBreakdown: form.expenseBreakdown,
    }
    if (editId) {
      updateEntry(editId, entry)
      setEditId(null)
    } else {
      addEntry(entry)
    }
    setForm(emptyForm)
    setShowForm(false)
    setShowBreakdown(false)
    setErrors({})
  }

  const startEdit = (e) => {
    setForm({
      date: e.date,
      sales: String(e.sales),
      card: String(e.card),
      expense: String(e.expense),
      notes: e.notes || '',
      expenseBreakdown: e.expenseBreakdown || {},
    })
    setEditId(e.id)
    setShowForm(true)
    setErrors({})
  }

  const cancelEdit = () => {
    setForm(emptyForm)
    setEditId(null)
    setShowForm(false)
    setErrors({})
  }

  const updateBreakdown = (cat, val) => {
    setForm(f => ({
      ...f,
      expenseBreakdown: { ...f.expenseBreakdown, [cat]: val ? parseFloat(val) : undefined }
    }))
  }

  const sortedEntries = [...entries].reverse()
  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">Daily Entry</h1>
          <p className="text-sm font-body text-stone-500 mt-1">{entries.length} records total</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => { setShowForm(!showForm); setEditId(null); setForm(emptyForm) }}>
          <Plus size={15} />
          {showForm && !editId ? 'Close' : 'Add Entry'}
        </button>
      </div>
          {/* Form */}
          {showForm && (
            <div className="card-glow p-6 animate-slide-in">
              <h2 className="font-display font-semibold text-stone-200 mb-5">
                {editId ? 'Edit Entry' : 'New Daily Entry'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="label">Date</label>
                  <input type="date" className="input-field" value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                  {errors.date && <p className="text-xs text-red-400 mt-1">{errors.date}</p>}
                </div>
                <div>
                  <label className="label">Total Sales (AED)</label>
                  <input type="number" className="input-field" placeholder="0.00" value={form.sales}
                    onChange={e => setForm(f => ({ ...f, sales: e.target.value }))} />
                  {errors.sales && <p className="text-xs text-red-400 mt-1">{errors.sales}</p>}
                </div>
                <div>
                  <label className="label">Card Collected (AED)</label>
                  <input type="number" className="input-field" placeholder="0.00" value={form.card}
                    onChange={e => setForm(f => ({ ...f, card: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Total Expense (AED)</label>
                  <input type="number" className="input-field" placeholder="0.00" value={form.expense}
                    onChange={e => setForm(f => ({ ...f, expense: e.target.value }))} />
                  {errors.expense && <p className="text-xs text-red-400 mt-1">{errors.expense}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Notes</label>
                  <input type="text" className="input-field" placeholder="Optional notes..." value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>

              {/* Computed preview */}
              {form.sales && form.expense && (
                <div className="mt-4 flex gap-4 flex-wrap">
                  <div className="bg-stone-800/40 rounded-xl px-4 py-2.5 text-xs font-body">
                    <span className="text-stone-500">Cash: </span>
                    <span className="text-stone-200 font-medium">AED {fmt(parseFloat(form.sales || 0) - parseFloat(form.card || 0))}</span>
                  </div>
                  <div className="bg-emerald-900/20 border border-emerald-800/30 rounded-xl px-4 py-2.5 text-xs font-body">
                    <span className="text-stone-500">Profit: </span>
                    <span className="text-emerald-400 font-medium">AED {fmt(parseFloat(form.sales || 0) - parseFloat(form.expense || 0))}</span>
                  </div>
                </div>
              )}

              {/* Expense breakdown toggle */}
              <button
                className="flex items-center gap-2 text-xs font-body text-stone-400 hover:text-stone-200 transition-colors mt-4"
                onClick={() => setShowBreakdown(!showBreakdown)}
              >
                {showBreakdown ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                Expense Breakdown (optional)
              </button>

              {showBreakdown && (
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-4 bg-stone-900/40 rounded-xl border border-stone-800/40">
                  {EXPENSE_CATEGORIES.map(cat => (
                    <div key={cat}>
                      <label className="text-xs font-body text-stone-600 block mb-1">{cat}</label>
                      <input
                        type="number"
                        className="input-field py-1.5 text-xs"
                        placeholder="0"
                        value={form.expenseBreakdown[cat] || ''}
                        onChange={e => updateBreakdown(cat, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-3 mt-5">
                <button className="btn-primary flex items-center gap-2" onClick={handleSubmit}>
                  <Check size={14} /> {editId ? 'Update' : 'Save Entry'}
                </button>
                <button className="btn-ghost flex items-center gap-2" onClick={cancelEdit}>
                  <X size={14} /> Cancel
                </button>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-stone-800/60">
                    <th className="table-th">Date</th>
                    <th className="table-th text-right">Sales</th>
                    <th className="table-th text-right hidden sm:table-cell">Card</th>
                    <th className="table-th text-right hidden sm:table-cell">Cash</th>
                    <th className="table-th text-right">Expense</th>
                    <th className="table-th text-right">Profit</th>
                    <th className="table-th text-right">Balance</th>
                    <th className="table-th text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedEntries.map(e => {
                    const profit = e.sales - e.expense
                    return (
                      <React.Fragment key={e.id}>
                        <tr className="table-row">
                          <td className="table-td">
                            <div>
                              <p className="font-display text-stone-200">{format(parseISO(e.date), 'EEE, MMM d')}</p>
                              {e.notes && <p className="text-xs text-stone-600 mt-0.5">{e.notes}</p>}
                            </div>
                          </td>
                          <td className="table-td text-right font-mono text-stone-200">{fmtAED(e.sales)}</td>
                          <td className="table-td text-right hidden sm:table-cell text-stone-400 font-mono">{fmtAED(e.card)}</td>
                          <td className="table-td text-right hidden sm:table-cell text-stone-400 font-mono">{fmtAED(e.cash)}</td>
                          <td className="table-td text-right font-mono text-red-400">{fmtAED(e.expense)}</td>
                          <td className="table-td text-right">
                            <span className={`font-display font-semibold ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {profit >= 0 ? '+' : ''}{fmtAED(profit)}
                            </span>
                          </td>
                          <td className="table-td text-right font-mono text-brand-400">{fmtAED(e.closingBalance)}</td>
                          <td className="table-td text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                className="p-1.5 rounded-lg hover:bg-stone-700/60 text-stone-500 hover:text-stone-200 transition-colors"
                                onClick={() => startEdit(e)}
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                className="p-1.5 rounded-lg hover:bg-red-900/30 text-stone-500 hover:text-red-400 transition-colors"
                                onClick={() => deleteEntry(e.id)}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                        {Object.keys(e.expenseBreakdown || {}).length > 0 && expandedRow === e.id && (
                          <tr className="bg-stone-900/30">
                            <td colSpan={8} className="px-4 py-3">
                              <div className="flex flex-wrap gap-2">
                                {Object.entries(e.expenseBreakdown).filter(([, v]) => v).map(([cat, val]) => (
                                  <span key={cat} className="badge-amber">{cat}: AED {fmt(val)}</span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {!entries.length && (
              <div className="text-center py-16">
                <p className="text-stone-600 font-body">No entries yet. Add your first daily entry above.</p>
              </div>
            )}
          </div>
    </div>
  )
}
