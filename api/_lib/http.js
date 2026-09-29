// Small helpers shared by the serverless functions in api/. Files whose name starts with an
// underscore are never deployed as endpoints of their own.

// Something a function is missing from its environment (Vercel → Settings → Environment Variables).
export class NotConfigured extends Error {
  constructor(name) {
    super(`${name} is not set on the server.`)
    this.missing = name
  }
}

// A refusal with a status code and a message that is safe to show the person who asked.
export class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

export const setting = (name) => (process.env[name] || '').trim()

export const requireSetting = (name) => {
  const value = setting(name)
  if (!value) throw new NotConfigured(name)
  return value
}

export const readBody = (req) => {
  if (req.body && typeof req.body === 'object') return req.body
  try {
    return JSON.parse(req.body || '{}')
  } catch (_) {
    return {}
  }
}

// Wraps a handler so refusals and missing settings answer as JSON, and nothing else leaks out.
export const route = (handler) => async (req, res) => {
  res.setHeader('Cache-Control', 'no-store')
  try {
    await handler(req, res)
  } catch (error) {
    if (error instanceof HttpError) return res.status(error.status).json({ success: false, error: error.message })
    if (error instanceof NotConfigured) {
      return res.status(503).json({ success: false, notConfigured: true, error: `Telegram alerts are not set up on the server yet (${error.missing} is missing).` })
    }
    // Only the message is logged: an error object can carry request details.
    console.error('telegram relay failed:', error?.message || error)
    return res.status(500).json({ success: false, error: 'Something went wrong on the server. Try again in a moment.' })
  }
}
