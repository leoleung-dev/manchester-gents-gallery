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
    const { id } = req.body
    if (!id) throw new Error('Missing id')

    await client
      .transaction()
      .delete(id)
      .delete(`drafts.${id}`)
      .commit({ retry: 3 })

    res.status(200).json({ success: true })
  } catch (err) {
    console.error('deleteComment error:', err)
    res.status(500).json({ success: false, message: err.message })
  }
}
