// src/api/uploadImages.js
import '../lib/loadEnv.js'
import formidable from 'formidable'
import fs from 'fs'
import { createClient } from '@sanity/client'
import { basename } from 'path'

export const config = {
  api: { bodyParser: false }, // required for formidable to work
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
    res.setHeader('Allow', 'POST')
    return res.status(405).end('Method Not Allowed')
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

    const uploaded = []

    const images = files.images
    if (!images) {
      return res.status(400).json({ error: 'No files uploaded' })
    }

    const fileArray = Array.isArray(images) ? images : [images]

    for (const file of fileArray) {
      if (!file || !file.filepath) continue

      try {
        const buffer = fs.readFileSync(file.filepath)

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
          createdAt: new Date().toISOString(),
        })

        uploaded.push(result._id)
      } catch (e) {
        console.error(`Error processing ${file.originalFilename}:`, e)
      }
    }

    res.status(200).json({ success: true, uploaded })
  })
}
