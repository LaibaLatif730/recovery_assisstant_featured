import sharp from 'sharp'

export async function resizeImage(buffer: Buffer, mimeType: string): Promise<string> {
  const maxDimension = 800
  const quality = 70

  let processed = sharp(buffer)

  const metadata = await sharp(buffer).metadata()
  if (metadata.width && metadata.width > maxDimension) {
    processed = processed.resize({ width: maxDimension, withoutEnlargement: true })
  } else if (metadata.height && metadata.height > maxDimension) {
    processed = processed.resize({ height: maxDimension, withoutEnlargement: true })
  }

  if (mimeType === 'image/png') {
    processed = processed.png({ quality })
  } else {
    processed = processed.jpeg({ quality })
  }

  const result = await processed.toBuffer()
  const base64 = result.toString('base64')
  console.log(`Image resized: ${buffer.length} -> ${result.length} bytes (${Math.round(result.length / 1024)}KB)`)

  return base64
}
