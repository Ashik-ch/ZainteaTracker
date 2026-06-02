export const fmt = (n, decimals = 2) =>
  new Intl.NumberFormat('en-AE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n ?? 0)

export const fmtAED = (n, short = false) => {
  if (short && Math.abs(n) >= 1000)
    return 'AED ' + (n / 1000).toFixed(1) + 'k'
  return 'AED ' + fmt(n)
}

export const fmtPct = (n) => (n ?? 0).toFixed(1) + '%'

export const clsx = (...args) => args.filter(Boolean).join(' ')
