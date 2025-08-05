// src/pages/Home.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import logo from "@/assets/Logo.svg";
import "./Home.css";
import imageUrlBuilder from "@sanity/image-url";
import { createClient } from "@sanity/client";

const sanity = createClient({
  projectId: "ulu3s1tc",
  dataset: "production",
  useCdn: true,
  apiVersion: "2023-08-03",
});
const urlFor = (source) => imageUrlBuilder(sanity).image(source);

// 🧠 Try parsing event title like "26 April, 2025" to Date object
function parseEventDate(title = "") {
  try {
    return new Date(title.replace(",", ""));
  } catch {
    return null;
  }
}

export default function Home({ apiBase }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isLocal =
    typeof window !== "undefined" && window.location.hostname === "localhost";
  const API = isLocal ? "" : apiBase ?? import.meta.env.VITE_API_BASE ?? "";

  useEffect(() => {
    async function fetchEvents() {
      try {
        setLoading(true);
        const res = await fetch(`${API}/api/getEventSlugs`);
        if (!res.ok) throw new Error(`Failed: ${res.status}`);
        const data = await res.json();

        // ✅ Sort by parsed date (descending)
        const sorted = [...data].sort((a, b) => {
          const dateA = parseEventDate(a.title);
          const dateB = parseEventDate(b.title);

          return (dateB?.getTime() ?? 0) - (dateA?.getTime() ?? 0);
        });

        setEvents(sorted);
      } catch (err) {
        console.error("Failed to fetch event slugs:", err);
        setError("⚠️ Could not load events. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, [API]);

  return (
    <div className="home-container">
      <img src={logo} alt="Manchester Gents Logo" className="home-logo" />
      <h1 className="home-title">📸 Manchester Gents Events</h1>

      {loading ? (
        <p className="home-status">Loading events…</p>
      ) : error ? (
        <p className="home-error">{error}</p>
      ) : events.length === 0 ? (
        <p className="home-status">No events yet.</p>
      ) : (
        <div className="event-grid">
          {events.map((event) => (
            <Link key={event._id} to={`/event/${event.slug}`} className="event-card">
              <div className="event-image-wrapper">
                {event.defaultCoverImage?.asset && (
                  <img
                    src={urlFor(event.defaultCoverImage).width(800).height(400).fit("crop").url()}
                    alt={event.title}
                    className="event-image"
                  />
                )}
                <div className="event-overlay">
                  <div className="event-overlay-text">
                    View photos from:<br />
                    <strong>{event.title || event.slug}</strong>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}