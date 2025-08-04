// api/bulkDeletePhoto.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { ids } = req.body
  if (!ids || !Array.isArray(ids)) {
    return res.status(400).json({ error: 'Missing or invalid ids' })
  }

  const results = []

  for (const id of ids) {
    try {
      const response = await fetch(`${req.headers.origin}/api/deletePhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })

      const result = await response.json()
      results.push({ id, ...result })

      if (!result.success) {
        console.warn(`❌ Failed to delete ${id}: ${result.message}`)
      }
    } catch (err) {
      console.error(`❌ Error deleting ${id}:`, err)
      results.push({ id, success: false, message: err.message })
    }
  }

  res.status(200).json({ success: true, results })
}
