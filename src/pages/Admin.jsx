import { useState } from "react";

export default function Admin() {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [createStatus, setCreateStatus] = useState(null);
  const [ogStatus, setOgStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCreateEvent = async () => {
    if (!title || !slug) {
      setCreateStatus({ error: "Please enter both title and slug." });
      return;
    }

    setCreateStatus("loading");
    try {
      const res = await fetch("/api/createEvent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, slug }),
      });

      const data = await res.json();
      setCreateStatus(data);
      setTitle("");
      setSlug("");
    } catch (err) {
      setCreateStatus({ error: "Failed to create event." });
    }
  };

  const handleRegenerateOG = async () => {
    setLoading(true);
    setOgStatus(null);

    try {
      const res = await fetch("/api/generateOgHtml", {
        method: "POST",
      });
      const data = await res.json();
      setOgStatus(data);
    } catch (err) {
      setOgStatus({ error: "OG generation failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "2rem" }}>🛠 Admin Panel</h1>

      <section style={{ marginBottom: "3rem" }}>
        <h2>📅 Create New Event</h2>
        <input
          placeholder="Event title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            padding: "0.5rem",
            marginRight: "1rem",
            marginTop: "0.5rem",
            width: "300px",
          }}
        />
        <input
          placeholder="Slug (e.g. 26Jul2025)"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          style={{
            padding: "0.5rem",
            marginRight: "1rem",
            marginTop: "0.5rem",
            width: "200px",
          }}
        />
        <button
          onClick={handleCreateEvent}
          style={{
            padding: "0.5rem 1rem",
            background: "#2d4059",
            color: "#ffd460",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          ➕ Create Event
        </button>

        {createStatus && (
          <pre
            style={{
              marginTop: "1rem",
              background: "#1c2837",
              color: "#ffd460",
              padding: "1rem",
              borderRadius: "6px",
              fontSize: "0.9rem",
            }}
          >
            {JSON.stringify(createStatus, null, 2)}
          </pre>
        )}
      </section>

      <section>
        <h2>🔄 Regenerate All OG HTML</h2>
        <button
          onClick={handleRegenerateOG}
          disabled={loading}
          style={{
            padding: "1rem 2rem",
            background: "#2d4059",
            color: "#ffd460",
            border: "none",
            borderRadius: "8px",
            fontSize: "1.25rem",
            cursor: "pointer",
          }}
        >
          {loading ? "Generating..." : "Regenerate OG HTML"}
        </button>

        {ogStatus && (
          <pre
            style={{
              marginTop: "1rem",
              background: "#1c2837",
              color: "#ffd460",
              padding: "1rem",
              borderRadius: "6px",
              fontSize: "0.9rem",
            }}
          >
            {JSON.stringify(ogStatus, null, 2)}
          </pre>
        )}
      </section>
    </div>
  );
}
