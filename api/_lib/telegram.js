// The Telegram Bot API, as little of it as the relay needs.
import { requireSetting } from './http.js'

// `payload` is a plain object (sent as JSON) or a FormData (a file upload).
export async function callBot(method, payload = {}) {
  const upload = payload instanceof FormData
  const response = await fetch(`https://api.telegram.org/bot${requireSetting('TELEGRAM_BOT_TOKEN')}/${method}`, {
    method: 'POST',
    headers: upload ? undefined : { 'content-type': 'application/json' },
    body: upload ? payload : JSON.stringify(payload),
  })
  const body = await response.json().catch(() => ({}))
  if (!body.ok) {
    const error = new Error(body.description || `Telegram answered ${response.status}`)
    error.code = body.error_code || response.status
    error.retryAfter = body.parameters?.retry_after
    throw error
  }
  return body.result
}

// `html` is Telegram's small HTML subset (<b>, <i>, <a>); everything dynamic in it must be escaped.
export const sendMessage = (chatId, html) =>
  callBot('sendMessage', { chat_id: chatId, text: html, parse_mode: 'HTML', disable_web_page_preview: true })

// What the apps store a picture or PDF as: `data:<type>;base64,<bytes>`.
export function parseDataUrl(dataUrl) {
  const match = /^data:([\w./+-]+);base64,([\s\S]+)$/.exec(String(dataUrl || ''))
  if (!match) return null
  const bytes = Buffer.from(match[2], 'base64')
  return bytes.length ? { mime: match[1], bytes } : null
}

const EXTENSIONS = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf' }
const PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

// Sends a stored picture or PDF to a chat: a picture shows inline as a photo, anything else (a PDF) as a file.
// A picture Telegram will not take as a photo goes as a file instead, so it is never lost. `name` is the
// file name without its extension; `caption` is Telegram HTML. Returns false when there is nothing to send.
export async function sendStoredFile(chatId, dataUrl, { name = 'file', caption = '' } = {}) {
  const file = parseDataUrl(dataUrl)
  if (!file) return false
  const filename = `${name}.${EXTENSIONS[file.mime] || 'bin'}`
  const upload = (field, method) => {
    const form = new FormData()
    form.set('chat_id', String(chatId))
    if (caption) {
      form.set('caption', caption)
      form.set('parse_mode', 'HTML')
    }
    form.set(field, new Blob([file.bytes], { type: file.mime }), filename)
    return callBot(method, form)
  }
  if (PHOTO_TYPES.has(file.mime)) {
    try {
      await upload('photo', 'sendPhoto')
      return true
    } catch (error) {
      if (error.code !== 400) throw error
    }
  }
  await upload('document', 'sendDocument')
  return true
}

let botUsername = ''

// The @name people open to talk to the bot: needed for the "connect" deep link.
export async function getBotUsername() {
  if (!botUsername) botUsername = (await callBot('getMe')).username || ''
  return botUsername
}

// The chat is gone for good: the person blocked the bot, or it was removed from the group.
export const isChatGone = (error) => error?.code === 403 || (error?.code === 400 && /chat not found/i.test(error.message || ''))
