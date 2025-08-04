// src/sanity.js
import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET,
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2023-08-03',
  useCdn: false,
})

const builder = imageUrlBuilder(client)

export function urlFor(source) {
  return builder.image(source)
}

export default client
