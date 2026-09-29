// A photo a seller sent in support chat, as the admin gets it on Telegram: the picture itself, right after
// the "New message from ..." alert (whose text alone would only say "📷 Photo").
//
// The alert comes from a `notifications` record made just after the message was saved; the message, with
// its picture, lives in the seller's conversation. The two are matched by time: the notification belongs
// to the seller's newest message that is not newer than it.
import { escapeHtml } from './format.js'

// How far before its notification a message may be and still be its own.
const MATCH_WINDOW_MS = 60 * 1000

export const conversationIdOf = (sellerId) => `support-${sellerId}`

// The seller's message the notification `note` was raised for, or null.
export function messageFor(conversation, note) {
  const notedAt = Date.parse(note.createdAt)
  if (Number.isNaN(notedAt)) return null
  let match = null
  for (const message of conversation.messages || []) {
    if (message.sender !== 'seller' || message.supersedes) continue
    const sentAt = Date.parse(message.at)
    if (Number.isNaN(sentAt) || sentAt > notedAt || notedAt - sentAt > MATCH_WINDOW_MS) continue
    if (!match || sentAt >= Date.parse(match.at)) match = message
  }
  return match
}

// Sends the picture of the message behind `note` to a chat. Returns false when that message had none (or
// belongs to another admin's seller), true once the picture has gone.
export async function sendChatPhoto({ db, adminId, note, chatId, sendFile }) {
  if (!note.sellerId) return false
  const snap = await db.collection('supportConversations').doc(conversationIdOf(note.sellerId)).get()
  if (!snap.exists) return false
  const conversation = snap.data()
  if (conversation.adminId !== adminId) return false
  const attachment = messageFor(conversation, note)?.attachment
  if (!attachment?.url) return false
  const from = String(note.title || '').replace(/^New message from\s*/i, '') || 'a seller'
  return sendFile(chatId, attachment.url, { name: `chat-photo-${Date.parse(note.createdAt) || 'new'}`, caption: `📷 Photo from ${escapeHtml(from)}` })
}
