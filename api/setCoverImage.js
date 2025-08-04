import setCorsHeaders from '../src/lib/setCorsHeaders.js'
import { createClient } from '@sanity/client'

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET,
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
  apiVersion: '2023-08-03',
})

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }

  const { slug, photoId } = req.body;

  if (!slug || !photoId) {
    return res.status(400).json({ message: 'Missing slug or photoId in request body' });
  }

  try {
    // Fetch the photo document to get its image asset reference
    const photo = await client.fetch(
      '*[_type == "photo" && _id == $photoId][0]{ image }',
      { photoId }
    );
    if (!photo || !photo.image) {
      return res.status(404).json({ message: 'Photo not found' });
    }

    // Fetch the event document _id by slug (assuming slug is stored in slug.current)
    const event = await client.fetch(
      '*[_type == "event" && slug.current == $slug][0]{ _id }',
      { slug }
    );
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Patch the event document to set the defaultCoverImage field
    await client.patch(event._id).set({ defaultCoverImage: photo.image }).commit();

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error setting cover image:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
