import { createClient } from '@sanity/client'

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET,
  useCdn: false,
  apiVersion: '2023-08-03',
})

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    const slugs = await client.fetch(`*[_type == "photo"].eventSlug`)
    const unique = Array.from(new Set(slugs.filter(Boolean)))
    res.status(200).json(unique)
  } catch (err) {
    console.error('getEventSlugs error:', err)
    res.status(500).json({ error: err.message })
  }
}
