export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const uploadServerUrl = 'https://manchestergents-uploadserver.up.railway.app/upload'

  try {
    const proxyRes = await fetch(uploadServerUrl, {
      method: 'POST',
      headers: req.headers,
      body: req,
    })

    const data = await proxyRes.json()
    res.status(proxyRes.status).json(data)
  } catch (err) {
    console.error('Proxy upload failed:', err)
    res.status(500).json({ error: 'Upload failed' })
  }
}
