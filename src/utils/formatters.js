export function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatDate(value, options = { day: 'numeric', month: 'short', year: 'numeric' }) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-IN', options).format(new Date(`${value}T12:00:00`))
}

export function formatStatus(status) {
  return String(status).toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())
}
