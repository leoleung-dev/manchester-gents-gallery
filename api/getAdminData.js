import { createClient } from '@sanity/client'

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET,
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
  apiVersion: '2023-08-03',
})

export default async function handler(req, res) {
  const { slug } = req.query
  if (!slug) return res.status(400).json({ error: 'Missing slug' })

  try {
    const [photos, comments] = await Promise.all([
      client.fetch(
        `*[_type == "photo" && eventSlug == $slug] | order(takenAt asc){
          _id, image, takenAt, _createdAt
        }`,
        { slug }
      ),
      client.fetch(
        `*[_type == "comment" && photo->eventSlug == $slug]{
          _id, name, instagram, message, createdAt,
          photo->{ image, takenAt }
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
