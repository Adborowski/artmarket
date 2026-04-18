/**
 * Resize an image file in the browser using Canvas before uploading.
 * If the image is already smaller than maxDimension, it is returned unchanged (as JPEG).
 */
export function resizeImage(file: File, maxDimension: number, quality = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      const { naturalWidth: w, naturalHeight: h } = img
      const scale = Math.min(1, maxDimension / Math.max(w, h))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(w * scale)
      canvas.height = Math.round(h * scale)

      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('Canvas 2d context unavailable')); return }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error('Canvas toBlob failed')),
        'image/jpeg',
        quality,
      )
    }

    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Image failed to load')) }
    img.src = objectUrl
  })
}
