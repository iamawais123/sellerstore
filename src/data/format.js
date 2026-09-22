const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

// "$8,230.00" — thousands separators, always two decimals.
export const formatPrice = (value) => usd.format(Number(value) || 0)

// Shortens long marketplace titles the way the live store does: keep everything before the first
// comma / dash / bracket when the name is too long, otherwise cut at a word boundary and add "…".
export const shortTitle = (value, limit = 70) => {
  if (!value) return ''
  const text = value.replace(/\s+/g, ' ').trim()
  if (text.length <= limit) return text
  const lead = text.match(/^([^,|()–—-]{20,})[\s,|()–—-]/)
  if (lead && lead[1].length <= limit) return lead[1].trim()
  const head = text.slice(0, limit)
  const cut = head.lastIndexOf(' ')
  return (cut > 30 ? head.slice(0, cut) : head).trim() + '…'
}
