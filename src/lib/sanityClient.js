// src/lib/sanityClientClient.js
import { createClient } from '@sanity/client'

const client = createClient({
  projectId: import.meta.env.VITE_SANITY_PROJECT_ID,
  dataset: import.meta.env.VITE_SANITY_DATASET,
  apiVersion: '2023-08-03',
  useCdn: true, // faster, safe for read-only
})

export default client
