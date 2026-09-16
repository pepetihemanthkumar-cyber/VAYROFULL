export function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatDate(value, options = { day: 'numeric', month: 'short', year: 'numeric' }) {
  if (!value) return '—'
  try {
    let date
    if (value instanceof Date) {
      date = value
    } else if (typeof value === 'number') {
      date = new Date(value)
    } else if (typeof value === 'string') {
      const trimmed = value.trim()
      if (trimmed.includes('T') || trimmed.includes(' ') || trimmed.length > 10) {
        date = new Date(trimmed)
      } else {
        date = new Date(`${trimmed}T12:00:00`)
      }
    } else {
      date = new Date(value)
    }

    if (isNaN(date.getTime())) {
      return String(value)
    }
    return new Intl.DateTimeFormat('en-IN', options).format(date)
  } catch {
    return String(value)
  }
}

export function formatStatus(status) {
  return String(status).toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())
}
