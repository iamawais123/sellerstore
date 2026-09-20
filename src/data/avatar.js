// The seller's profile photo is kept on their shop document, so it is cropped to a square, scaled
// down and re-encoded as a small JPEG data URL first.
import { loadImage, readAsDataUrl } from './kycDocument'

const SIZE = 256
export const MAX_AVATAR_CHARS = 60000

// Resolves to a data URL that fits on the shop, or throws an Error whose message is fit to show.
export async function prepareAvatar(file) {
  if (!file) return null
  if (!file.type.startsWith('image/')) throw new Error('Choose a JPG, PNG or WEBP photo.')
  const image = await loadImage(await readAsDataUrl(file), file.name)
  const side = Math.min(image.width, image.height)
  let size = SIZE
  let quality = 0.85
  for (let attempt = 0; attempt < 8; attempt++) {
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const context = canvas.getContext('2d')
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, size, size)
    context.drawImage(image, (image.width - side) / 2, (image.height - side) / 2, side, side, 0, 0, size, size)
    const url = canvas.toDataURL('image/jpeg', quality)
    if (url.length <= MAX_AVATAR_CHARS) return url
    if (quality > 0.5) quality -= 0.1
    else size = Math.round(size * 0.8)
  }
  throw new Error('That photo could not be compressed enough. Try a smaller one.')
}
