// src/App.jsx
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import EventGallery from './pages/EventGallery'
import AdminPanel from './pages/admin/AdminPanel'

export default function App({ apiBase }) {
  return (
    <Routes>
      <Route path="/" element={<Home apiBase={apiBase} />} />
      <Route path="/event/:slug" element={<EventGallery apiBase={apiBase} />} />
      <Route path="/event/:slug/admin" element={<AdminPanel apiBase={apiBase} />} />
    </Routes>
  )
}
