// api/deletePhoto.js

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
    if (!id) throw new Error('Missing `id` in request body')

    // 1. Fetch the photo's asset reference
    const photo = await client.fetch(
      '*[_id == $id][0]{ "assetRef": image.asset._ref }',
      { id }
    )

    if (!photo) {
      return res.status(404).json({ success: false, message: 'Photo not found' })
    }

    const { assetRef } = photo

    // 2. Get all comment IDs referencing this photo
    const commentIds = await client.fetch(
      '*[_type == "comment" && photo._ref == $id]._id',
      { id }
    )

    // 3. Create a Sanity transaction
    const tx = client.transaction()

    // 3a. Delete all referencing comments (and their drafts)
    for (const cid of commentIds) {
      tx.delete(cid)
      tx.delete(`drafts.${cid}`)
    }

    // 3b. Delete the photo document (and its draft)
    tx.delete(id)
    tx.delete(`drafts.${id}`)

    // 3c. Delete the image asset itself
    if (assetRef) {
      tx.delete(assetRef)
    }

    // 4. Commit the transaction
    await tx.commit({ retry: 3 })

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('❌ deletePhoto error:', err)
    return res.status(500).json({ success: false, message: err.message })
  }
}