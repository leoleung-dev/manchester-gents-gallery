import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

export default function Home({ apiBase }) {
  const [events, setEvents] = useState([])
  const API = apiBase || ''

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch(`${API}/api/getEventSlugs`)
        if (!res.ok) throw new Error(`Failed: ${res.status}`)
        const data = await res.json()
        setEvents(data)
      } catch (err) {
        console.error('Failed to fetch event slugs:', err)
      }
    }

    fetchEvents()
  }, [API])

  return (
    <div className="p-8 max-w-3xl mx-auto text-center">
      <h1 className="text-4xl font-bold mb-6">📸 Manchester Gents Events</h1>
      <div className="space-y-3">
        {events.length === 0 ? (
          <p className="text-gray-500 italic">No events yet.</p>
        ) : (
          events.map(event => (
            <Link
              key={event}
              to={`/event/${event}`}
              className="block text-lg text-blue-600 hover:underline"
            >
              View photos from: <strong>{event}</strong>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
