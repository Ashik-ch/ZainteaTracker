import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { clsx } from '../utils/format'

export default function StatCard({ label, value, sub, icon: Icon, trend, trendLabel, accent = false, delay = 0 }) {
  return (
    <div
      className={clsx('card p-5 animate-fade-up', accent && 'card-glow')}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-display font-medium text-stone-500 uppercase tracking-wider">{label}</p>
        {Icon && (
          <div className={clsx(
            'w-8 h-8 rounded-lg flex items-center justify-center',
            accent ? 'bg-brand-500/20' : 'bg-stone-800'
          )}>
            <Icon size={15} className={accent ? 'text-brand-400' : 'text-stone-400'} />
          </div>
        )}
      </div>
      <p className={clsx('font-display font-bold text-2xl', accent ? 'text-brand-300' : 'text-stone-100')}>
        {value}
      </p>
      <div className="flex items-center justify-between mt-2">
        {sub && <p className="text-xs font-body text-stone-600">{sub}</p>}
        {trend !== undefined && (
          <div className={clsx(
            'flex items-center gap-1 text-xs font-body',
            trend >= 0 ? 'text-emerald-400' : 'text-red-400'
          )}>
            {trend >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            <span>{trendLabel}</span>
          </div>
        )}
      </div>
    </div>
  )
}
