import '../src/lib/loadEnv.js'
import { createClient } from '@sanity/client'

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET,
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
  apiVersion: '2023-08-03',
})

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const { name, instagram, message, photoId } = req.body

    if (!photoId || !message?.trim()) {
      return res.status(400).json({ success: false, message: 'Missing required fields' })
    }

    const { _id } = await client.create({
      _type: 'comment',
      name,
      instagram,
      message,
      photo: { _type: 'reference', _ref: photoId },
      createdAt: new Date().toISOString(),
    })

    res.status(200).json({ success: true, commentId: _id })
  } catch (err) {
    console.error('addComment error:', err)
    res.status(500).json({ success: false, message: err.message })
  }
}
