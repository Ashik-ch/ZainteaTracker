import React, { useState } from 'react'
import { useBusiness } from '../context/BusinessContext'
import { fmtAED, fmtPct, fmt } from '../utils/format'
import { Target, TrendingUp, Lightbulb, CheckCircle, AlertCircle, ChevronRight, Save } from 'lucide-react'

const TIPS = [
  {
    category: 'Revenue Growth',
    color: 'emerald',
    icon: TrendingUp,
    items: [
      { title: 'Boost weekend sales', body: 'Your data shows Fridays & Saturdays are peak days. Introduce weekend-only specials or combo deals to capitalize on high footfall.', impact: 'High' },
      { title: 'Loyalty program', body: 'Introduce a stamp card — buy 9 teas, get 1 free. Returning customers spend 60% more than new ones on average.', impact: 'High' },
      { title: 'Pre-orders & catering', body: 'Offer bulk orders for offices and events near you. A single office order can replace 50+ walk-in sales.', impact: 'Medium' },
      { title: 'Slow-day promotions', body: 'Days with sales under AED 3,500 benefit from "happy hour" offers (2-4 PM deals). Increase volume during off-peak hours.', impact: 'Medium' },
      { title: 'Upsell add-ons', body: 'Train staff to suggest snacks or extra toppings with every order. Even AED 2 more per transaction × 100 customers = AED 200/day extra.', impact: 'High' },
    ]
  },
  {
    category: 'Cost Reduction',
    color: 'amber',
    icon: Target,
    items: [
      { title: 'Negotiate veg market bulk deal', body: 'Spending AED 24,752/month on vegetables. A 10% bulk discount saves AED 2,475/month = AED 29,700/year.', impact: 'High' },
      { title: 'Consolidate chicken suppliers', body: 'Currently using Federal Chicken + Master Chicken. One supplier with volume commitment can reduce protein costs by 10–15%.', impact: 'High' },
      { title: 'Optimize gas & delivery routes', body: 'Gas cost AED 5,585 over 20 days. Reduce delivery frequency from daily to every 2 days for dry goods. Save ~AED 1,200/month.', impact: 'Medium' },
      { title: 'Track "Other" expenses', body: '"Other" category is untracked. Itemizing all expenses reveals hidden leaks — often 5–8% of total spend is recoverable.', impact: 'Medium' },
      { title: 'Staff meal budget control', body: 'Set a fixed daily budget for staff food/water. Even saving AED 5/day = AED 150/month.', impact: 'Low' },
    ]
  },
  {
    category: 'Operations',
    color: 'blue',
    icon: Lightbulb,
    items: [
      { title: 'Weekly sales review', body: 'Review the previous week every Monday. Spot patterns early — if Wed is always slow, prepare offers by Tuesday evening.', impact: 'High' },
      { title: 'Stock forecasting', body: 'Based on your peak days, maintain a 2-day buffer stock for veg, chicken, and milk to avoid emergency purchasing at premium prices.', impact: 'Medium' },
      { title: 'Daily cash reconciliation', body: 'Verify cash vs POS every evening before closing. Discrepancies caught same-day are 10× easier to resolve.', impact: 'High' },
      { title: 'Track customer count', body: 'Add daily customer count to entries. Knowing average ticket size (Sales ÷ Customers) helps set realistic growth targets.', impact: 'Medium' },
    ]
  },
]

const IMPACT_COLOR = { High: 'badge-green', Medium: 'badge-amber', Low: 'badge-red' }

export default function Goals() {
  const { goals, updateGoals, stats } = useBusiness()
  const [form, setForm] = useState(goals)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    updateGoals({
      dailySalesTarget: parseFloat(form.dailySalesTarget),
      monthlyProfitTarget: parseFloat(form.monthlyProfitTarget),
      expenseRatioTarget: parseFloat(form.expenseRatioTarget),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const salesPct = stats.avgDailySales ? (stats.avgDailySales / goals.dailySalesTarget) * 100 : 0
  const profitPct = stats.totalProfit ? (stats.totalProfit / goals.monthlyProfitTarget) * 100 : 0
  const expenseOk = stats.expenseRatio <= goals.expenseRatioTarget

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="section-title">Goals & Improvement</h1>
        <p className="text-sm font-body text-stone-500 mt-1">Set targets and act on data-driven recommendations</p>
      </div>

      {/* Goal setting */}
      <div className="card-glow p-6">
        <h2 className="font-display font-semibold text-stone-200 mb-5 flex items-center gap-2">
          <Target size={16} className="text-brand-400" />
          Business Targets
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-5">
          <div>
            <label className="label">Daily Sales Target (AED)</label>
            <input type="number" className="input-field" value={form.dailySalesTarget}
              onChange={e => setForm(f => ({ ...f, dailySalesTarget: e.target.value }))} />
            <div className="mt-2">
              <div className="flex justify-between text-xs font-body text-stone-600 mb-1">
                <span>Current avg {fmtAED(stats.avgDailySales, true)}</span>
                <span>{salesPct.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-stone-800 rounded-full h-1.5">
                <div className={`h-1.5 rounded-full transition-all ${salesPct >= 100 ? 'bg-emerald-500' : 'bg-brand-500'}`}
                  style={{ width: `${Math.min(salesPct, 100)}%` }} />
              </div>
            </div>
          </div>
          <div>
            <label className="label">Monthly Profit Target (AED)</label>
            <input type="number" className="input-field" value={form.monthlyProfitTarget}
              onChange={e => setForm(f => ({ ...f, monthlyProfitTarget: e.target.value }))} />
            <div className="mt-2">
              <div className="flex justify-between text-xs font-body text-stone-600 mb-1">
                <span>Actual {fmtAED(stats.totalProfit, true)}</span>
                <span>{profitPct.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-stone-800 rounded-full h-1.5">
                <div className={`h-1.5 rounded-full transition-all ${profitPct >= 100 ? 'bg-emerald-500' : 'bg-brand-500'}`}
                  style={{ width: `${Math.min(profitPct, 100)}%` }} />
              </div>
            </div>
          </div>
          <div>
            <label className="label">Max Expense Ratio (%)</label>
            <input type="number" className="input-field" value={form.expenseRatioTarget}
              onChange={e => setForm(f => ({ ...f, expenseRatioTarget: e.target.value }))} />
            <div className="mt-2 flex items-center gap-2">
              {expenseOk
                ? <><CheckCircle size={13} className="text-emerald-400" /><span className="text-xs font-body text-emerald-400">On target ({fmtPct(stats.expenseRatio)})</span></>
                : <><AlertCircle size={13} className="text-red-400" /><span className="text-xs font-body text-red-400">Over target ({fmtPct(stats.expenseRatio)})</span></>
              }
            </div>
          </div>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={handleSave}>
          {saved ? <><CheckCircle size={14} /> Saved!</> : <><Save size={14} /> Save Targets</>}
        </button>
      </div>

      {/* Tips */}
      {TIPS.map(section => (
        <div key={section.category} className="space-y-3">
          <div className="flex items-center gap-2">
            <section.icon size={15} className={`text-${section.color}-400`} />
            <h2 className="font-display font-semibold text-stone-300">{section.category}</h2>
          </div>
          <div className="space-y-2">
            {section.items.map(tip => (
              <div key={tip.title} className="card p-4 hover:border-stone-700/60 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <p className="font-display font-medium text-stone-200 text-sm">{tip.title}</p>
                      <span className={IMPACT_COLOR[tip.impact]}>{tip.impact} impact</span>
                    </div>
                    <p className="text-xs font-body text-stone-500 leading-relaxed">{tip.body}</p>
                  </div>
                  <ChevronRight size={14} className="text-stone-700 flex-shrink-0 mt-1" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
