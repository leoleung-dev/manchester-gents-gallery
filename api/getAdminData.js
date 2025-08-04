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
    // Fetch photos where the linked event's slug matches
    const photos = await client.fetch(
      `*[_type == "photo" && event->slug.current == $slug]
        | order(coalesce(takenAt, _createdAt) desc) {
          _id,
          image,
          takenAt,
          _createdAt
        }`,
      { slug }
    )

    // Fetch comments where the linked photo belongs to the matching event
    const comments = await client.fetch(
      `*[_type == "comment" && photo->event->slug.current == $slug] 
        | order(createdAt desc) {
          _id,
          name,
          instagram,
          message,
          createdAt,
          photo->{ image, takenAt }
        }`,
      { slug }
    )

    res.status(200).json({ photos, comments })
  } catch (err) {
    console.error('getAdminData error:', err)
    res.status(500).json({ error: err.message })
  }
}
