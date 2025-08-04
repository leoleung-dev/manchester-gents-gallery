// server.cjs
require('dotenv').config()
const express = require('express')
const cors = require('cors')
const multer = require('multer')
const { createClient } = require('@sanity/client')

const app = express()
const upload = multer()

// ——— SANITY CLIENT ———
const client = createClient({
  projectId: process.env.VITE_SANITY_PROJECT_ID,
  dataset:  process.env.VITE_SANITY_DATASET,
  token:    process.env.SANITY_API_TOKEN,
  useCdn:   false,
  apiVersion: '2023-08-03',
})

// ——— MIDDLEWARE ———
app.use(cors())
app.use(express.json())

// ─── GET DISTINCT EVENT SLUGS ────────────────────────────────────────────────
app.get('/api/getEventSlugs', async (req, res) => {
  try {
    // Fetch all photo documents' eventSlug, then dedupe in one go
    const slugs = await client.fetch(
      'array::unique(*[_type=="photo"].eventSlug)'
    )
    res.json(slugs || [])
  } catch (err) {
    console.error('getEventSlugs error:', err)
    res.status(500).json({ success: false, message: err.message })
  }
})

// ─── GET PHOTOS BY EVENT ─────────────────────────────────────────────────────
app.get('/api/getPhotos/:slug', async (req, res) => {
  try {
    const { slug } = req.params
    const photos = await client.fetch(
      `*[_type=="photo" && eventSlug == $slug] | order(createdAt desc){
         _id, image, createdAt
       }`,
      { slug }
    )
    // Map to include URLs
    const withUrls = photos.map(p => ({
      _id: p._id,
      createdAt: p.createdAt,
      url:     `https://${client.config().projectId}.api.sanity.io/v${client.config().apiVersion}/assets/images/${client.config().dataset}/${p.image.asset._ref}`,
      // or use urlFor if you want transformations
    }))
    res.json(withUrls)
  } catch (err) {
    console.error('getPhotos error:', err)
    res.status(500).json({ success: false, message: err.message })
  }
})

// ─── IMAGE UPLOAD ─────────────────
app.post('/api/uploadImages', upload.array('images'), async (req, res) => {
  try {
    const { eventSlug } = req.body
    const files = req.files || []

    // upload files
    const assets = await Promise.all(
      files.map(f => client.assets.upload('image', f.buffer, { filename: f.originalname }))
    )
    // create docs
    await Promise.all(
      assets.map(({ _id }) =>
        client.create({
          _type: 'photo',
          eventSlug,
          image: { _type: 'image', asset: { _type: 'reference', _ref: _id } },
          createdAt: new Date().toISOString(),
        })
      )
    )
    res.json({ success: true })
  } catch (err) {
    console.error('uploadImages error:', err)
    res.status(500).json({ success: false, message: err.message })
  }
})

// ─── COMMENTS ──────────────────────
app.post('/api/addComment', async (req, res) => {
  try {
    const { name, instagram, message, photoId } = req.body
    const { _id } = await client.create({
      _type: 'comment',
      name,
      instagram,
      message,
      photo: { _type: 'reference', _ref: photoId },
      createdAt: new Date().toISOString(),
    })
    res.json({ success: true, commentId: _id })
  } catch (err) {
    console.error('addComment error:', err)
    res.status(500).json({ success: false, message: err.message })
  }
})

app.post('/api/deleteComment', async (req, res) => {
  try {
    const { id } = req.body
    if (!id) throw new Error('Missing comment id')
    await client.transaction()
      .delete(id)
      .delete(`drafts.${id}`)
      .commit({ retry: 3 })
    res.json({ success: true })
  } catch (err) {
    console.error('deleteComment error:', err)
    res.status(500).json({ success: false, message: err.message })
  }
})

app.post('/api/bulkDeleteComment', async (req, res) => {
  try {
    const { ids } = req.body
    if (!Array.isArray(ids) || !ids.length) throw new Error('Missing ids array')
    const tx = client.transaction()
    ids.forEach(cid => {
      tx.delete(cid)
      tx.delete(`drafts.${cid}`)
    })
    await tx.commit({ retry: 3 })
    res.json({ success: true })
  } catch (err) {
    console.error('bulkDeleteComment error:', err)
    res.status(500).json({ success: false, message: err.message })
  }
})

// ─── PHOTOS ────────────────────────
app.post('/api/deletePhoto', async (req, res) => {
  try {
    const { id } = req.body
    if (!id) throw new Error('Missing photo id')

    // fetch comment IDs
    const commentIds = await client.fetch(
      '*[_type=="comment" && photo._ref==$id]._id',
      { id }
    )

    const tx = client.transaction()
    commentIds.forEach(cid => {
      tx.delete(cid)
      tx.delete(`drafts.${cid}`)
    })
    tx.delete(id)
    tx.delete(`drafts.${id}`)
    await tx.commit({ retry: 3 })

    res.json({ success: true })
  } catch (err) {
    console.error('deletePhoto error:', err)
    res.status(500).json({ success: false, message: err.message })
  }
})

app.post('/api/bulkDeletePhoto', async (req, res) => {
  try {
    const { ids } = req.body
    if (!Array.isArray(ids) || !ids.length) throw new Error('Missing ids array')

    // fetch all comment IDs
    const commentIds = await client.fetch(
      '*[_type=="comment" && photo._ref in $ids]._id',
      { ids }
    )

    const tx = client.transaction()
    commentIds.forEach(cid => {
      tx.delete(cid)
      tx.delete(`drafts.${cid}`)
    })
    ids.forEach(pid => {
      tx.delete(pid)
      tx.delete(`drafts.${pid}`)
    })
    await tx.commit({ retry: 3 })

    res.json({ success: true })
  } catch (err) {
    console.error('bulkDeletePhoto error:', err)
    res.status(500).json({ success: false, message: err.message })
  }
})

// ─── START SERVER ──────────────────
const PORT = process.env.PORT || 4000
const HOST = process.env.HOST || '0.0.0.0'
app.listen(PORT, HOST, () => {
  console.log(`API server running at http://${HOST}:${PORT}`)
})
