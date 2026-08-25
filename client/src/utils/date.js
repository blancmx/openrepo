export function formatDateParts(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value || '')
  if (!match) return null
  return {
    ym: `${match[1]}.${match[2]}`,
    day: String(Number(match[3])),
  }
}

export function formatDateTime(value) {
  return (value || '').slice(0, 16)
}
