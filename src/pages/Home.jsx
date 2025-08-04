import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import logo from '@/assets/Logo.svg' // adjust path as needed

export default function Home({ apiBase }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const isLocal = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  const API = isLocal ? '' : (apiBase ?? import.meta.env.VITE_API_BASE ?? '')

  useEffect(() => {
    async function fetchEvents() {
      try {
        setLoading(true)
        const res = await fetch(`${API}/api/getEventSlugs`)
        if (!res.ok) throw new Error(`Failed: ${res.status}`)
        const data = await res.json()
        setEvents(data)
      } catch (err) {
        console.error('Failed to fetch event slugs:', err)
        setError('⚠️ Could not load events. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [API])

  return (
    <div className="page-bg p-8 max-w-3xl mx-auto text-center min-h-screen flex flex-col items-center justify-center">
      <img src={logo} alt="Manchester Gents Logo" className="w-48 mb-8" />
      <h1 className="text-4xl font-bold mb-6">📸 Manchester Gents Events</h1>

      {loading ? (
        <p className="text-gray-400 italic">Loading events…</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : events.length === 0 ? (
        <p className="text-gray-500 italic">No events yet.</p>
      ) : (
        <div className="space-y-3 w-full">
          {events.map(event => (
            <Link
              key={event}
              to={`/event/${event}`}
              className="event-link"
            >
              View photos from: <strong>{event}</strong>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
