// src/api/getAdminData.js
import client from '../lib/sanity'

export default async function handler(req, res) {
  const { slug } = req.query
  if (!slug) return res.status(400).json({ error: 'Missing slug' })

  try {
    const [photos, comments] = await Promise.all([
      client.fetch(
        `*[_type == "photo" && eventSlug == $slug]{
          _id, image, createdAt
        } | order(createdAt desc)`,
        { slug }
      ),
      client.fetch(
        `*[_type == "comment" && photo->eventSlug == $slug]{
          _id, name, instagram, message, createdAt,
          photo->{ image }
        } | order(createdAt desc)`,
        { slug }
      )
    ])

    res.status(200).json({ photos, comments })
  } catch (err) {
    console.error('getAdminData error:', err)
    res.status(500).json({ error: err.message })
  }
}
