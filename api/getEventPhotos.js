import { createClient } from '@sanity/client'

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET,
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
  apiVersion: '2023-08-03',
})

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const { slug } = req.query

  if (!slug) {
    return res.status(400).json({ error: 'Missing event slug' })
  }

  try {
    // Fetch photos with EXIF and createdAt
    const photos = await client.fetch(
      `*[_type == "photo" && eventSlug == $slug]{
        _id,
        image,
        _createdAt,
        "exifDate": image.asset->metadata.exif.DateTimeOriginal
      }`,
      { slug }
    )

    // Sort by EXIF date if available, else by _createdAt
    const sorted = photos.sort((a, b) => {
      const parseExif = str =>
        str ? new Date(str.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3')) : null

      const aDate = parseExif(a.exifDate) || new Date(a._createdAt)
      const bDate = parseExif(b.exifDate) || new Date(b._createdAt)

      return aDate - bDate // oldest first
    })

    res.status(200).json(sorted)
  } catch (err) {
    console.error('getEventPhotos error:', err)
    res.status(500).json({ error: err.message })
  }
}
