import { createClient } from '@sanity/client'
import setCorsHeaders from '../src/lib/setCorsHeaders.js'

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET,
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
  apiVersion: '2023-08-03',
})

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const { slug } = req.query

  if (!slug) {
    return res.status(400).json({ error: 'Missing event slug' })
  }

  try {
    const photos = await client.fetch(
      `*[_type == "photo" && event->slug.current == $slug] 
        | order(coalesce(takenAt, _createdAt) desc) {
          _id,
          image,
          takenAt,
          _createdAt,
          uploaderName
        }`,
      { slug }
    )

    res.status(200).json(photos)
  } catch (err) {
    console.error('getEventPhotos error:', err)
    res.status(500).json({ error: err.message })
  }
}
