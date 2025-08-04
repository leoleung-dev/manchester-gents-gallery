import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import EventGallery from './pages/EventGallery'
import AdminPanel from './pages/admin/AdminPanel'

export default function App({ apiBase }) {
  const base = apiBase || import.meta.env.VITE_API_BASE || ''

  return (
    <Routes>
      <Route path="/" element={<Home apiBase={base} />} />
      <Route path="/event/:slug" element={<EventGallery apiBase={base} />} />
      <Route path="/event/:slug/admin" element={<AdminPanel apiBase={base} />} />
    </Routes>
  )
}
