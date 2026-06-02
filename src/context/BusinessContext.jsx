import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'

const BusinessContext = createContext(null)

const EXPENSE_CATEGORIES = [
  'Veg Market', 'Federal Chicken', 'Gas', 'Hamda Plastic',
  'Snacks', 'Madeena Bakery', 'Milk', 'Soft Drinks',
  'Staff Water/Food', 'Modern', 'Breakfast', 'Purchase',
  'Masafi Water', 'Master Chicken', 'Goat Bone', 'Grocery',
  'Supermarket', 'Topup', 'Service', 'Alkabeer',
  'Ice Cream', 'Donation', 'Day to Day', 'Watchman Rent', 'Other'
]

const SEED_DATA = (() => {
  const sales = [4276.75,6588.25,4709.5,4003.75,3654.25,3762.5,3759.75,3844.75,5579.25,5275.75,3976.25,3239.25,3532,3965.25,3584.75,6424.25,4416.75,3272.25,3118.25,3740.75,3018,3978.5,5669.25,5003.5,4411,5000,6296.5,4347,3521.75,6275,4439.25]
  const expenses = [2617.25,3761.75,2614,2203.75,1845.75,1972.5,2112.75,1974.75,3142.25,2862.25,2466.75,1852.25,1998,2066.25,1951.25,3460.25,2547.75,1789.75,1761.25,2054.25,1817,2055,2781.75,2457,2280,2779.5,3050.5,2421,1718.75,3845.5,4439.25]
  const card = [1659.5,2826.5,2095.5,1800,1808.5,1790,1647,1870,2437,2413.5,1509.5,1387,1534,1899,1633.5,2964,1869,1482.5,1357,1686.5,1201,1923.5,2887.5,2546.5,2131,2220.5,3246,1926,1803,2429.5,2132]
  const entries = []
  let balance = 0
  for (let i = 0; i < 31; i++) {
    const opening = balance
    const cash = sales[i] - card[i]
    balance = opening + sales[i] - expenses[i]
    entries.push({
      id: `may-${i+1}`,
      date: `2024-05-${String(i+1).padStart(2,'0')}`,
      sales: sales[i],
      card: card[i],
      cash: parseFloat(cash.toFixed(2)),
      expense: expenses[i],
      openingBalance: parseFloat(opening.toFixed(2)),
      closingBalance: parseFloat(balance.toFixed(2)),
      notes: '',
      expenseBreakdown: {},
    })
  }
  return entries
})()

export function BusinessProvider({ children }) {
  const [entries, setEntries] = useState(() => {
    try {
      const saved = localStorage.getItem('zaintea_entries')
      return saved ? JSON.parse(saved) : SEED_DATA
    } catch { return SEED_DATA }
  })

  const [settlements, setSettlements] = useState(() => {
    try {
      const saved = localStorage.getItem('zaintea_settlements')
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })

  const [goals, setGoals] = useState(() => {
    try {
      const saved = localStorage.getItem('zaintea_goals')
      return saved ? JSON.parse(saved) : {
        dailySalesTarget: 5000,
        monthlyProfitTarget: 50000,
        expenseRatioTarget: 60,
      }
    } catch { return { dailySalesTarget: 5000, monthlyProfitTarget: 50000, expenseRatioTarget: 60 } }
  })

  useEffect(() => { localStorage.setItem('zaintea_entries', JSON.stringify(entries)) }, [entries])
  useEffect(() => { localStorage.setItem('zaintea_settlements', JSON.stringify(settlements)) }, [settlements])
  useEffect(() => { localStorage.setItem('zaintea_goals', JSON.stringify(goals)) }, [goals])

  const addEntry = useCallback((entry) => {
    setEntries(prev => {
      const last = prev[prev.length - 1]
      const openingBalance = last ? last.closingBalance : 0
      const closingBalance = openingBalance + entry.sales - entry.expense
      const newEntry = {
        ...entry,
        id: `entry-${Date.now()}`,
        openingBalance: parseFloat(openingBalance.toFixed(2)),
        closingBalance: parseFloat(closingBalance.toFixed(2)),
      }
      const updated = [...prev, newEntry].sort((a, b) => a.date.localeCompare(b.date))
      // recalculate balances
      let bal = 0
      return updated.map(e => {
        const o = bal
        bal = o + e.sales - e.expense
        return { ...e, openingBalance: parseFloat(o.toFixed(2)), closingBalance: parseFloat(bal.toFixed(2)) }
      })
    })
  }, [])

  const updateEntry = useCallback((id, updates) => {
    setEntries(prev => {
      const updated = prev.map(e => e.id === id ? { ...e, ...updates } : e)
        .sort((a, b) => a.date.localeCompare(b.date))
      let bal = 0
      return updated.map(e => {
        const o = bal
        bal = o + e.sales - e.expense
        return { ...e, openingBalance: parseFloat(o.toFixed(2)), closingBalance: parseFloat(bal.toFixed(2)) }
      })
    })
  }, [])

  const deleteEntry = useCallback((id) => {
    setEntries(prev => {
      const updated = prev.filter(e => e.id !== id)
      let bal = 0
      return updated.map(e => {
        const o = bal
        bal = o + e.sales - e.expense
        return { ...e, openingBalance: parseFloat(o.toFixed(2)), closingBalance: parseFloat(bal.toFixed(2)) }
      })
    })
  }, [])

  const addSettlement = useCallback((s) => {
    setSettlements(prev => [...prev, { ...s, id: `settlement-${Date.now()}` }])
  }, [])

  const deleteSettlement = useCallback((id) => {
    setSettlements(prev => prev.filter(s => s.id !== id))
  }, [])

  const updateGoals = useCallback((g) => setGoals(g), [])

  // Computed stats
  const stats = React.useMemo(() => {
    if (!entries.length) return {}
    const totalSales = entries.reduce((s, e) => s + e.sales, 0)
    const totalExpense = entries.reduce((s, e) => s + e.expense, 0)
    const totalProfit = totalSales - totalExpense
    const avgDailySales = totalSales / entries.length
    const avgDailyExpense = totalExpense / entries.length
    const profitMargin = (totalProfit / totalSales) * 100
    const closingBalance = entries[entries.length - 1]?.closingBalance ?? 0
    const bestDay = [...entries].sort((a, b) => b.sales - a.sales)[0]
    const worstDay = [...entries].sort((a, b) => a.sales - b.sales)[0]
    const totalSettlements = settlements.reduce((s, e) => s + (e.amount || 0), 0)
    return {
      totalSales, totalExpense, totalProfit, avgDailySales,
      avgDailyExpense, profitMargin, closingBalance,
      bestDay, worstDay, totalSettlements,
      expenseRatio: (totalExpense / totalSales) * 100,
    }
  }, [entries, settlements])

  return (
    <BusinessContext.Provider value={{
      entries, settlements, goals, stats,
      addEntry, updateEntry, deleteEntry,
      addSettlement, deleteSettlement, updateGoals,
      EXPENSE_CATEGORIES,
    }}>
      {children}
    </BusinessContext.Provider>
  )
}

export const useBusiness = () => {
  const ctx = useContext(BusinessContext)
  if (!ctx) throw new Error('useBusiness must be inside BusinessProvider')
  return ctx
}
