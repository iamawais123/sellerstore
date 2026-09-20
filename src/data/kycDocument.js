// KYC documents live inside a Firestore document (front + back together must stay under 1 MiB), so
// photos are downscaled and re-encoded as JPEG before they are uploaded. A PDF cannot be
// re-encoded in the browser, so it is accepted only when it is already small enough.
export const MAX_DOCUMENT_CHARS = 450000 // per image, as a base64 data URL (firestore.rules enforces 460000)

export const readAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error(`Could not read "${file.name}".`))
    reader.readAsDataURL(file)
  })

export const loadImage = (url, name) =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`"${name}" is not a readable image.`))
    image.src = url
  })

// Resolves to a data URL that fits in Firestore, or throws an Error whose message is fit to show.
export async function prepareKycDocument(file) {
  if (!file) return null

  if (file.type === 'application/pdf') {
    const url = await readAsDataUrl(file)
    if (url.length > MAX_DOCUMENT_CHARS) {
      throw new Error(`"${file.name}" is too large. PDFs must be under about 330 KB — upload a photo or scan (JPG/PNG) instead and it will be compressed for you.`)
    }
    return url
  }

  if (!file.type.startsWith('image/')) throw new Error(`"${file.name}" is not supported. Upload a JPG, PNG, WEBP or PDF file.`)

  const image = await loadImage(await readAsDataUrl(file), file.name)
  let longestSide = 1600
  let quality = 0.82
  for (let attempt = 0; attempt < 10; attempt++) {
    const scale = Math.min(1, longestSide / Math.max(image.width, image.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.width * scale))
    canvas.height = Math.max(1, Math.round(image.height * scale))
    const context = canvas.getContext('2d')
    // JPEG has no alpha channel: flatten transparent PNGs onto white instead of black.
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    const url = canvas.toDataURL('image/jpeg', quality)
    if (url.length <= MAX_DOCUMENT_CHARS) return url
    if (quality > 0.5) quality -= 0.12
    else longestSide = Math.round(longestSide * 0.8)
  }
  throw new Error(`"${file.name}" could not be compressed enough. Try a smaller photo.`)
}
