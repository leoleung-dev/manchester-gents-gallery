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
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ success: false, message: 'Method Not Allowed' })
  }

  try {
    const { id } = req.body
    if (!id) throw new Error('Missing id')

    // 1) Get image asset reference
    const photo = await client.fetch(
      '*[_id == $id][0]{ "assetRef": image.asset._ref }',
      { id }
    )
    if (!photo?.assetRef) {
      return res.status(404).json({ success: false, message: 'Photo not found' })
    }
    const { assetRef } = photo

    // 2) Find all comments referencing the photo
    const commentIds = await client.fetch(
      '*[_type == "comment" && photo._ref == $id]._id',
      { id }
    )

    // 3) Prepare transaction
    const tx = client.transaction()
    commentIds.forEach((cid) => {
      tx.delete(cid)
      tx.delete(`drafts.${cid}`)
    })
    tx.delete(id)
    tx.delete(`drafts.${id}`)
    tx.delete(assetRef)

    // 4) Commit transaction
    await tx.commit({ retry: 3 })

    res.status(200).json({ success: true })
  } catch (err) {
    console.error('deletePhoto error:', err)
    res.status(500).json({ success: false, message: err.message })
  }
}
