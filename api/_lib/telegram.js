// The Telegram Bot API, as little of it as the relay needs.
import { requireSetting } from './http.js'

// `payload` is a plain object (sent as JSON).
export async function callBot(method, payload = {}) {
  const response = await fetch(`https://api.telegram.org/bot${requireSetting('TELEGRAM_BOT_TOKEN')}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
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

let botUsername = ''

// The @name people open to talk to the bot: needed for the "connect" deep link.
export async function getBotUsername() {
  if (!botUsername) botUsername = (await callBot('getMe')).username || ''
  return botUsername
}

// The chat is gone for good: the person blocked the bot, or it was removed from the group.
export const isChatGone = (error) => error?.code === 403 || (error?.code === 400 && /chat not found/i.test(error.message || ''))
