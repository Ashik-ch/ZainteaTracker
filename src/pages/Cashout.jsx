import React, { useEffect, useMemo, useState } from 'react'
import { format, parseISO, subDays } from 'date-fns'
import { Check, Plus, X, Loader2 } from 'lucide-react'
import { fmtAED } from '../utils/format'
import { useBusiness } from '../context/BusinessContext'
import {
  isFirebaseEnabled,
  fetchCategories,
  saveCategories,
  fetchMatrix,
  saveMatrixDoc,
  fetchDaily,
  saveDailyDoc
} from '../firebase'

const defaultCategories = []

const pad = (n) => String(n).padStart(2, '0')
const toDateKeyLocal = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

const settlementDate = () => {
  const now = new Date()
  const effective = now.getHours() < 3 ? subDays(now, 1) : now
  return toDateKeyLocal(effective)
}

const parseMoney = (v) => {
  const n = parseFloat(v)
  return Number.isFinite(n) ? n : 0
}

const formatMonthLabel = (monthKey) => format(parseISO(`${monthKey}-01`), 'MMMM yyyy')

export default function Cashout() {
  const { entries } = useBusiness()

  const [activeDate] = useState(settlementDate())
  const [selectedMonth, setSelectedMonth] = useState(() => settlementDate().slice(0, 7))
  const [loading, setLoading] = useState(isFirebaseEnabled())

  const [categories, setCategories] = useState(defaultCategories)

  // matrix: { [dateKey]: { [category]: { amount: number, notes: string } } }
  const [matrix, setMatrix] = useState({})

  // daily: { [dateKey]: { cash: number|string, card: number|string, confirmed: boolean } }
  const [daily, setDaily] = useState({})

  useEffect(() => {
    if (!isFirebaseEnabled()) {
      setLoading(false)
      return
    }

    const loadFirebaseData = async () => {
      try {
        const fbCategories = await fetchCategories()
        const fbMatrix = await fetchMatrix()
        const fbDaily = await fetchDaily()

        console.log("fbCategories", fbCategories);
        console.log("fbMatrix", fbMatrix);
        console.log("fbDaily", fbDaily);
        if (fbCategories) {
          setCategories(fbCategories)
        } else {
          await saveCategories(defaultCategories)
          setCategories(defaultCategories)
        }

        if (fbMatrix) setMatrix(fbMatrix)
        if (fbDaily) setDaily(fbDaily)
      } catch (err) {
        console.error('Error fetching data from Firestore:', err)
      } finally {
        setLoading(false)
      }
    }

    loadFirebaseData()
  }, [])

  const activeConfirmed = !!daily?.[activeDate]?.confirmed

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerForm, setDrawerForm] = useState({ amount: '', category: '', notes: '' })
  const [drawerErrors, setDrawerErrors] = useState({})

  const [newCategory, setNewCategory] = useState('')

  const allDatesForMonths = useMemo(() => {
    const d1 = Object.keys(matrix || {})
    const d2 = Object.keys(daily || {})
    const d3 = entries.map((e) => e.date)
    return [...new Set([...d1, ...d2, ...d3])]
  }, [matrix, daily, entries])

  const monthOptions = useMemo(() => {
    const keys = [...new Set(allDatesForMonths.map((d) => d.slice(0, 7)))]
    const sorted = keys.sort((a, b) => b.localeCompare(a))
    return sorted.map((k) => ({ value: k, label: formatMonthLabel(k) }))
  }, [allDatesForMonths])

  useEffect(() => {
    const exists = monthOptions.some((m) => m.value === selectedMonth)
    if (!exists && monthOptions.length) setSelectedMonth(monthOptions[0].value)
  }, [monthOptions, selectedMonth])

  const daysInMonth = useMemo(() => {
    const [y, m] = selectedMonth.split('-').map(Number)
    if (!y || !m) return []
    const first = new Date(y, m - 1, 1)
    const last = new Date(y, m, 0)
    const out = []
    const cursor = new Date(first)
    while (cursor <= last) {
      out.push(toDateKeyLocal(cursor))
      cursor.setDate(cursor.getDate() + 1)
    }
    return out
  }, [selectedMonth])

  const daysCount = daysInMonth.length || 1

  const isActiveMonth = selectedMonth === activeDate.slice(0, 7)

  const expenseTotalForDay = (dateKey) =>
    categories.reduce((sum, cat) => {
      const catVal = matrix?.[dateKey]?.[cat]?.amount
      return sum + (Number.isFinite(catVal) ? catVal : parseMoney(catVal))
    }, 0)

  const cashForDay = (dateKey) => parseMoney(daily?.[dateKey]?.cash)
  const cardForDay = (dateKey) => parseMoney(daily?.[dateKey]?.card)
  const totalSaleForDay = (dateKey) => cardForDay(dateKey) + cashForDay(dateKey) - expenseTotalForDay(dateKey)

  const canEditActive = (isActiveMonth && !activeConfirmed)

  const resetDrawer = () => {
    setDrawerErrors({})
    setDrawerForm({
      amount: '',
      category: categories[0] || '',
      notes: '',
    })
  }

  useEffect(() => {
    if (!drawerOpen) return
    resetDrawer()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawerOpen])

  const addCategoryMinimal = () => {
    const trimmed = newCategory.trim()
    if (!trimmed) return
    const exists = categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())
    if (exists) return
    const nextCategories = [...categories, trimmed]
    setCategories(nextCategories)
    if (isFirebaseEnabled()) {
      saveCategories(nextCategories)
    }
    setNewCategory('')
    setDrawerForm((prev) => ({ ...prev, category: trimmed }))
  }

  const validateDrawer = () => {
    const e = {}
    const amount = parseFloat(drawerForm.amount)
    if (!drawerForm.amount || Number.isNaN(amount) || amount <= 0) e.amount = 'Amount must be greater than 0'
    if (!drawerForm.category) e.category = 'Category is required'
    setDrawerErrors(e)
    return Object.keys(e).length === 0
  }

  const submitDrawer = () => {
    if (activeConfirmed) return
    if (!validateDrawer()) return

    const amount = parseFloat(drawerForm.amount)
    const notes = drawerForm.notes.trim()
    const updatedEntry = { amount, notes }
    console.log("updatedEntry", updatedEntry);

    setMatrix((prev) => {
      const next = { ...prev }
      if (!next[activeDate]) next[activeDate] = {}
      next[activeDate][drawerForm.category] = updatedEntry
      return next
    })

    setDrawerOpen(false)
    setNewCategory('')
  }

  const confirmActiveSettlement = async () => {
    const cash = daily?.[activeDate]?.cash
    const card = daily?.[activeDate]?.card
    const cashN = parseMoney(cash)
    const cardN = parseMoney(card)

    if (!isActiveMonth) return
    if (activeConfirmed) return

    if (cash === '' || card === '' || Number.isNaN(cashN) || Number.isNaN(cardN)) {
      setDrawerErrors({
        settlement: 'Cash and Card are required to confirm (for active settlement day).',
      })
      return
    }

    const confirmedDoc = {
      ...(daily?.[activeDate] || {}),
      cash: cashN,
      card: cardN,
      confirmed: true,
    }

    setDaily((prev) => ({
      ...prev,
      [activeDate]: confirmedDoc,
    }))

    console.log(":categories", categories);

    if (isFirebaseEnabled()) {
      setLoading(true)
      try {
        await saveDailyDoc(activeDate, confirmedDoc)

        const activeMatrixData = matrix[activeDate] || {}
        await saveMatrixDoc(activeDate, activeMatrixData)

        await saveCategories(categories)

        console.log('Firebase upload successful for date:', activeDate)

        // Refetch all and list again
        const fbCategories = await fetchCategories()
        const fbMatrix = await fetchMatrix()
        const fbDaily = await fetchDaily()

        if (fbCategories) setCategories(fbCategories)
        if (fbMatrix) setMatrix(fbMatrix)
        if (fbDaily) setDaily(fbDaily)
      } catch (err) {
        console.error('Error uploading settlement to Firebase:', err)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleDailyBlur = (dateKey) => {
    // No-op for now. All data is committed on Confirm Settlement.
  }

  const showLockedBadge = (dateKey) => {
    if (dateKey !== activeDate) return { label: 'Locked', cls: 'bg-stone-800 text-stone-300' }
    if (activeConfirmed) return { label: 'Confirmed', cls: 'bg-emerald-900/40 text-emerald-300' }
    return { label: 'Open', cls: 'bg-amber-900/30 text-amber-300' }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
        <p className="text-sm font-body text-stone-500 animate-pulse">Loading cashout data from Firestore...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="section-title">Cashout</h1>
        <p className="text-sm font-body text-stone-500 mt-1">
          Active settlement day: {format(parseISO(activeDate), 'EEE, MMM d')} (3:00 AM cutoff)
        </p>
      </div>

      {/* Section 1 */}
      <div className="flex items-start justify-between gap-4">
        <div className="w-full max-w-xs card p-4 sm:p-5">
          <label className="label">Table Month View</label>
          <select
            className="input-field"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            disabled={!monthOptions.length}
          >
            {monthOptions.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-shrink-0 pt-1">
          <button
            className={`btn-primary flex items-center gap-2 ${!isActiveMonth ? 'opacity-50 cursor-not-allowed' : ''}`}

            onClick={() => setDrawerOpen(true)}
            type="button"
          >
            <Plus size={16} />
            <span>Add Cashout</span>
          </button>
        </div>
      </div>

      {/* Section 2 */}
      <div className="card overflow-hidden">
        <div className="p-4 sm:p-5 flex items-center justify-between gap-3 border-b border-stone-800/60">
          <div className="text-xs font-body text-stone-500">
            Showing: <span className="text-stone-200 font-medium">{formatMonthLabel(selectedMonth)}</span>
            {isActiveMonth && (
              <>
                {' '}
                · Active day: <span className="text-stone-200 font-medium">{format(parseISO(activeDate), 'MMM d')}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              className={`btn-ghost flex items-center gap-2 ${!canEditActive ? 'opacity-50' : ''}`}
              type="button"
              onClick={confirmActiveSettlement}
              disabled={!canEditActive}
            >
              <Check size={14} />
              Confirm Settlement
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone-800/60">
                <th className="table-th sticky left-0 bg-[#17140e] z-10 min-w-[200px]">Category</th>
                {daysInMonth.map((dateKey) => {
                  const badge = showLockedBadge(dateKey)
                  return (
                    <th key={dateKey} className="table-th text-center min-w-[120px]">
                      <div className="flex flex-col items-center gap-1">
                        <span>{format(parseISO(dateKey), 'd')}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>
                      </div>
                    </th>
                  )
                })}
                <th className="table-th text-right min-w-[140px]">Total</th>
                <th className="table-th text-right min-w-[170px]">Average per day</th>
              </tr>
            </thead>

            <tbody>
              {/* Expense categories */}
              {categories.map((category) => {
                const values = daysInMonth.map((d) => matrix?.[d]?.[category]?.amount ?? 0)
                const total = values.reduce((s, v) => s + (Number.isFinite(v) ? v : 0), 0)
                const avg = total / daysCount
                return (
                  <tr className="table-row" key={category}>
                    <td className="table-td sticky left-0 bg-[#17140e] text-stone-200 font-medium">{category}</td>
                    {daysInMonth.map((dateKey) => {
                      const entry = matrix?.[dateKey]?.[category]
                      const hasVal = entry && entry.amount !== undefined && entry.amount !== null && entry.amount !== ''
                      return (
                        <td key={`${category}-${dateKey}`} className="table-td text-right font-mono text-stone-300">
                          {hasVal ? fmtAED(entry.amount || 0) : '-'}
                        </td>
                      )
                    })}
                    <td className="table-td text-right font-mono text-red-400">{fmtAED(total)}</td>
                    <td className="table-td text-right font-mono text-stone-400">{fmtAED(avg)}</td>
                  </tr>
                )
              })}

              {/* Cash row */}
              <tr className="table-row">
                <td className="table-td sticky left-0 bg-[#17140e] text-stone-400 font-medium">Cash</td>
                {daysInMonth.map((dateKey) => {
                  const locked = (dateKey !== activeDate || activeConfirmed)
                  const val = daily?.[dateKey]?.cash ?? ''
                  return (
                    <td key={`cash-${dateKey}`} className="table-td text-right">
                      {(dateKey === activeDate) ? (
                        <input
                          type="number"
                          className="input-field py-1.5 text-xs text-right font-mono"
                          placeholder="0"
                          value={val}
                          disabled={locked}
                          onChange={(e) => {
                            const nextVal = e.target.value
                            setDaily((prev) => ({
                              ...prev,
                              [dateKey]: {
                                ...(prev?.[dateKey] || { confirmed: false }),
                                cash: nextVal,
                              },
                            }))
                          }}
                          onBlur={() => handleDailyBlur(dateKey)}
                        />
                      ) : (
                        <span className="font-mono text-stone-300">
                          {daily?.[dateKey]?.cash !== undefined && daily?.[dateKey]?.cash !== '' ? fmtAED(parseMoney(daily?.[dateKey]?.cash)) : '-'}
                        </span>
                      )}
                    </td>
                  )
                })}
                <td className="table-td text-right font-mono">{fmtAED(daysInMonth.reduce((s, d) => s + cashForDay(d), 0))}</td>
                <td className="table-td text-right font-mono text-stone-400">
                  {fmtAED(daysInMonth.reduce((s, d) => s + cashForDay(d), 0) / daysCount)}
                </td>
              </tr>

              {/* Card row */}
              <tr className="table-row">
                <td className="table-td sticky left-0 bg-[#17140e] text-stone-400 font-medium">Card</td>
                {daysInMonth.map((dateKey) => {
                  const locked = dateKey !== activeDate || activeConfirmed
                  const val = daily?.[dateKey]?.card ?? ''
                  return (
                    <td key={`card-${dateKey}`} className="table-td text-right">
                      {(
                        <span className="font-mono text-stone-300">
                          {daily?.[dateKey]?.card !== undefined && daily?.[dateKey]?.card !== '' ? fmtAED(parseMoney(daily?.[dateKey]?.card)) : '-'}
                        </span>
                      )}
                    </td>
                  )
                })}
                <td className="table-td text-right font-mono">{fmtAED(daysInMonth.reduce((s, d) => s + cardForDay(d), 0))}</td>
                <td className="table-td text-right font-mono text-stone-400">
                  {fmtAED(daysInMonth.reduce((s, d) => s + cardForDay(d), 0) / daysCount)}
                </td>
              </tr>

              {/* Total sale row */}
              <tr className="border-t border-stone-800/60">
                <td className="table-td sticky left-0 bg-[#17140e] text-emerald-300 font-semibold">Total sale</td>
                {daysInMonth.map((dateKey) => {
                  const sale = totalSaleForDay(dateKey)
                  return (
                    <td key={`sale-${dateKey}`} className="table-td text-right font-mono text-emerald-300">
                      {(sale)}
                    </td>
                  )
                })}
                <td className="table-td text-right font-mono text-emerald-300">
                  {fmtAED(daysInMonth.reduce((s, d) => s + totalSaleForDay(d), 0))}
                </td>
                <td className="table-td text-right font-mono text-stone-400">
                  {fmtAED(daysInMonth.reduce((s, d) => s + totalSaleForDay(d), 0) / daysCount)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Sliding Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDrawerOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-[#111009] border-l border-stone-800/60 p-5 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display font-semibold text-stone-200">Add Cashout</h2>
                <p className="text-xs font-body text-stone-500 mt-1">
                  Active date: {format(parseISO(activeDate), 'yyyy-MM-dd')}
                </p>
              </div>
              <button className="btn-ghost p-2" onClick={() => setDrawerOpen(false)} type="button">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {!canEditActive && (
                <div className="text-xs text-amber-300/90 bg-amber-900/20 border border-amber-800/30 rounded-xl px-3 py-2">
                  Editing is locked (either confirmed or you are viewing another month).
                </div>
              )}

              {drawerErrors.settlement && (
                <div className="text-xs text-red-300 bg-red-900/20 border border-red-800/30 rounded-xl px-3 py-2">
                  {drawerErrors.settlement}
                </div>
              )}

              <div>
                <label className="label">Amount (AED)</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="0.00"
                  value={drawerForm.amount}
                  disabled={activeConfirmed}
                  onChange={(e) => setDrawerForm((prev) => ({ ...prev, amount: e.target.value }))}
                />
                {drawerErrors.amount && <p className="text-xs text-red-400 mt-1">{drawerErrors.amount}</p>}
              </div>

              <div>
                <label className="label">Category</label>
                <select
                  className="input-field"
                  value={drawerForm.category}
                  disabled={activeConfirmed}
                  onChange={(e) => setDrawerForm((prev) => ({ ...prev, category: e.target.value }))}
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                {drawerErrors.category && <p className="text-xs text-red-400 mt-1">{drawerErrors.category}</p>}
              </div>

              <div>
                <label className="label">Notes (optional)</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Optional notes..."
                  value={drawerForm.notes}
                  disabled={activeConfirmed}
                  onChange={(e) => setDrawerForm((prev) => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button className="btn-ghost" onClick={() => setDrawerOpen(false)} type="button" disabled={false}>
                  Cancel
                </button>
                <button
                  className={`btn-primary flex items-center gap-2 ${activeConfirmed ? 'opacity-60' : ''}`}
                  onClick={submitDrawer}
                  type="button"
                  disabled={activeConfirmed}
                >
                  <Plus size={14} />
                  Submit
                </button>
              </div>

              <div className="pt-2 border-t border-stone-800/60">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-body text-stone-500">Add category (optional)</label>
                  <button
                    type="button"
                    className="btn-ghost py-1.5 px-2 text-xs whitespace-nowrap opacity-80"
                    onClick={addCategoryMinimal}
                    disabled={activeConfirmed}
                  >
                    Add
                  </button>
                </div>
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Category name"
                    value={newCategory}
                    disabled={activeConfirmed}
                    onChange={(e) => setNewCategory(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
