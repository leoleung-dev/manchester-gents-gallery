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
    const { ids } = req.body
    if (!Array.isArray(ids) || !ids.length) throw new Error('Missing ids')

    const tx = client.transaction()
    ids.forEach((cid) => {
      tx.delete(cid)
      tx.delete(`drafts.${cid}`)
    })

    await tx.commit({ retry: 3 })

    res.status(200).json({ success: true })
  } catch (err) {
    console.error('bulkDeleteComment error:', err)
    res.status(500).json({ success: false, message: err.message })
  }
}
