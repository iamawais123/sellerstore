// Points the Telegram bot at the deployed relay (api/telegram-webhook.js). Run once after deploying,
// and again if the domain changes:
//
//   TELEGRAM_BOT_TOKEN=... TELEGRAM_WEBHOOK_SECRET=... node scripts/set-telegram-webhook.mjs https://your-domain.com
//
// The token and secret must be the same values as in the deployment's environment variables.
const { TELEGRAM_BOT_TOKEN: token, TELEGRAM_WEBHOOK_SECRET: secret } = process.env
const site = (process.argv[2] || '').replace(/\/+$/, '')

if (!token || !secret || !/^https:\/\//.test(site)) {
  console.error('Usage: TELEGRAM_BOT_TOKEN=... TELEGRAM_WEBHOOK_SECRET=... node scripts/set-telegram-webhook.mjs https://your-domain.com')
  process.exit(1)
}

const call = async (method, payload = {}) => {
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const body = await response.json()
  if (!body.ok) throw new Error(body.description || `Telegram answered ${response.status}`)
  return body.result
}

try {
  const bot = await call('getMe')
  await call('setWebhook', { url: `${site}/api/telegram-webhook`, secret_token: secret, allowed_updates: ['message'] })
  const info = await call('getWebhookInfo')
  console.log(`Bot @${bot.username} now delivers to ${info.url}`)
  if (info.last_error_message) console.log(`Telegram last reported: ${info.last_error_message}`)
} catch (error) {
  console.error(`Failed: ${error.message}`)
  process.exit(1)
}
