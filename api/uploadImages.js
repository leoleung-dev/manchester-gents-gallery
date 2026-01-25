import { createClient } from '@sanity/client'
import setCorsHeaders from '../src/lib/setCorsHeaders.js'

export const config = {
  api: {
    bodyParser: false,
  },
}

const sanityClient = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET,
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
  apiVersion: '2023-08-03',
})

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') return res.status(405).end()

  const eventSlug = req.query.eventSlug || req.headers['x-event-slug'] || null
  const uploaderName =
    req.query.uploaderName || req.headers['x-uploader-name'] || null
  const uploadServerUrl = new URL('https://mg-fly-uploadserver.fly.dev/upload')
  if (eventSlug) uploadServerUrl.searchParams.set('eventSlug', eventSlug)
  if (uploaderName) uploadServerUrl.searchParams.set('uploaderName', uploaderName)

  try {
    // Proxy upload to your upload server (streamed)
    const forwardHeaders = {}
    if (req.headers['content-type']) forwardHeaders['content-type'] = req.headers['content-type']
    if (req.headers['x-event-slug']) forwardHeaders['x-event-slug'] = req.headers['x-event-slug']
    if (req.headers['x-uploader-name']) {
      forwardHeaders['x-uploader-name'] = req.headers['x-uploader-name']
    }

    const proxyRes = await fetch(uploadServerUrl.toString(), {
      method: 'POST',
      headers: forwardHeaders,
      // Node fetch requires duplex when sending a readable stream
      duplex: 'half',
      body: req,
    })

    if (!proxyRes.ok) {
      const errorText = await proxyRes.text()
      return res.status(proxyRes.status).json({ error: errorText })
    }

    let uploadData
    const text = await proxyRes.text()
    try {
      uploadData = JSON.parse(text)
    } catch {
      uploadData = { raw: text }
    }
    if (uploadData?.docId) {
      return res.status(201).json({
        success: true,
        docId: uploadData.docId,
        assetId: uploadData?.assetId || null,
      })
    }
    const assetId =
      uploadData?.assetId || uploadData?.asset?._ref || uploadData?.asset?._id
    if (!assetId) {
      return res.status(502).json({
        error: 'Upload server did not return a valid asset id',
        details: uploadData,
      })
    }

    if (!eventSlug) {
      return res.status(400).json({ error: 'Missing eventSlug in request' })
    }

    // Fetch event document _id by slug
    const event = await sanityClient.fetch(
      '*[_type=="event" && slug.current == $slug][0]{_id}',
      { slug: eventSlug }
    )

    if (!event) {
      return res.status(404).json({ error: `Event with slug '${eventSlug}' not found` })
    }

    // Construct photo document with event reference and uploaded image info
    const photoDoc = {
      _type: 'photo',
      event: {
        _type: 'reference',
        _ref: event._id,
      },
      image: {
        _type: 'image',
        asset: {
          _type: 'reference',
          _ref: assetId,
        },
      },
    }
    const trimmedUploader = typeof uploaderName === 'string' ? uploaderName.trim() : ''
    if (trimmedUploader) {
      photoDoc.uploaderName = trimmedUploader
    }

    // Create photo document in Sanity
    const createdPhoto = await sanityClient.create(photoDoc)

    res.status(201).json({ success: true, photo: createdPhoto })
  } catch (err) {
    console.error('Upload and Sanity create failed:', err)
    res.status(500).json({ error: 'Upload failed' })
  }
}
