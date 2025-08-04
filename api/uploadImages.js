import formidable from 'formidable'
import fs from 'fs'
import { basename } from 'path'
import { createClient } from '@sanity/client'
import exifr from 'exifr'

// Required by Vercel to disable default body parsing
export const config = {
  api: {
    bodyParser: false,
  },
}

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET,
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2023-08-03',
  useCdn: false,
})

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const form = formidable({ multiples: true, keepExtensions: true })

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Form parse error:', err)
      return res.status(400).json({ error: 'Upload error' })
    }

    const eventSlug = Array.isArray(fields.eventSlug)
      ? fields.eventSlug[0]
      : fields.eventSlug

    if (!eventSlug || typeof eventSlug !== 'string') {
      return res.status(400).json({ error: 'Invalid eventSlug' })
    }

    const images = files.images
    if (!images) {
      return res.status(400).json({ error: 'No files uploaded' })
    }

    const takenAtRaw = fields.takenAt || []
    const takenAtArray = Array.isArray(takenAtRaw) ? takenAtRaw : [takenAtRaw]
    const fileArray = Array.isArray(images) ? images : [images]

    const uploaded = []

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i]
      if (!file || !file.filepath) continue

      let takenAt = takenAtArray[i] || null

      try {
        const buffer = fs.readFileSync(file.filepath)

        // Extract takenAt from EXIF if not provided
        if (!takenAt) {
          try {
            const exifData = await exifr.parse(buffer, { pick: ['DateTimeOriginal'] })
            if (exifData?.DateTimeOriginal) {
              takenAt = new Date(exifData.DateTimeOriginal).toISOString()
            }
          } catch (exifErr) {
            console.warn(`Failed to extract EXIF for ${file.originalFilename}:`, exifErr)
          }
        }

        // Upload image to Sanity
        const asset = await client.assets.upload('image', buffer, {
          filename: basename(file.originalFilename),
        })

        const result = await client.create({
          _type: 'photo',
          eventSlug,
          image: {
            _type: 'image',
            asset: { _type: 'reference', _ref: asset._id },
          },
          ...(takenAt ? { takenAt } : {}),
        })

        uploaded.push(result._id)
      } catch (e) {
        console.error(`Error uploading ${file.originalFilename}:`, e)
      }
    }

    res.status(200).json({ success: true, uploaded })
  })
}
