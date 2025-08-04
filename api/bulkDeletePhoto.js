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

    // 1) Fetch assetRefs for all photos
    const photos = await client.fetch(
      '*[_id in $ids]{ _id, "assetRef": image.asset._ref }',
      { ids }
    )

    // 2) Fetch comments linked to any of the photos
    const commentIds = await client.fetch(
      '*[_type=="comment" && photo._ref in $ids]._id',
      { ids }
    )

    // 3) Build transaction
    const tx = client.transaction()

    commentIds.forEach((cid) => {
      tx.delete(cid)
      tx.delete(`drafts.${cid}`)
    })

    photos.forEach(({ _id, assetRef }) => {
      tx.delete(_id)
      tx.delete(`drafts.${_id}`)
      if (assetRef) tx.delete(assetRef)
    })

    await tx.commit({ retry: 3 })

    res.status(200).json({ success: true })
  } catch (err) {
    console.error('bulkDeletePhoto error:', err)
    res.status(500).json({ success: false, message: err.message })
  }
}
