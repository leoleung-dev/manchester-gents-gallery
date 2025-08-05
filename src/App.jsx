import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import EventGallery from './pages/EventGallery';
import AdminPanel from './pages/admin/AdminPanel';
import Admin from './pages/Admin';

export default function App({ apiBase }) {
  const base = apiBase || import.meta.env.VITE_API_BASE || '';

  return (
    <BrowserRouter basename="/">
      <Routes>
        <Route path="/" element={<Home apiBase={base} />} />
        <Route path="/event/:slug" element={<EventGallery apiBase={base} />} />
        <Route path="/event/:slug/admin" element={<AdminPanel apiBase={base} />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}