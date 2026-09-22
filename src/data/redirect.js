// Only follow ?redirect= targets that stay on this site.
export const safeRedirect = (value, fallback = '/') =>
  typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : fallback
