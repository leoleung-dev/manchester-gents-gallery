import { useState } from "react";

export default function Admin() {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [createStatus, setCreateStatus] = useState(null);
  const [deployStatus, setDeployStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const deployUrl = import.meta.env.VITE_VERCEL_DEPLOY_HOOK;

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

  const handleTriggerDeploy = async () => {
    if (!deployUrl) {
      setDeployStatus({ error: "Deploy hook URL is missing!" });
      return;
    }

    setLoading(true);
    setDeployStatus(null);

    try {
      const res = await fetch(deployUrl, { method: "POST" });
      if (res.ok) {
        setDeployStatus({ success: true, message: "Deploy triggered successfully." });
      } else {
        const err = await res.json();
        setDeployStatus({ error: true, details: err });
      }
    } catch (err) {
      setDeployStatus({ error: "Failed to trigger deploy." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: "3rem",
        fontFamily: "sans-serif",
        backgroundColor: "#1c2837",
        color: "#ffd460",
        minHeight: "100vh",
      }}
    >
      <h1 style={{ fontSize: "2.5rem", marginBottom: "2rem" }}>🛠 Admin Panel</h1>

      {/* Create Event */}
      <section
        style={{
          marginBottom: "4rem",
          padding: "2rem",
          background: "#2d4059",
          borderRadius: "10px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
        }}
      >
        <h2 style={{ fontSize: "1.5rem" }}>📅 Create New Event</h2>
        <div style={{ marginTop: "1rem", display: "flex", flexWrap: "wrap", gap: "1rem" }}>
          <input
            placeholder="Event title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              padding: "0.75rem",
              width: "300px",
              borderRadius: "6px",
              border: "none",
              fontSize: "1rem",
            }}
          />
          <input
            placeholder="Slug (e.g. 26Jul2025)"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            style={{
              padding: "0.75rem",
              width: "200px",
              borderRadius: "6px",
              border: "none",
              fontSize: "1rem",
            }}
          />
          <button
            onClick={handleCreateEvent}
            style={{
              padding: "0.75rem 1.5rem",
              background: "#ffc62d",
              color: "#1c2837",
              border: "none",
              borderRadius: "6px",
              fontWeight: "bold",
              cursor: "pointer",
              fontSize: "1rem",
            }}
          >
            ➕ Create Event
          </button>
        </div>

        {createStatus && (
          <pre
            style={{
              marginTop: "1rem",
              background: "#1c2837",
              color: "#ffe293",
              padding: "1rem",
              borderRadius: "6px",
              fontSize: "0.9rem",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {JSON.stringify(createStatus, null, 2)}
          </pre>
        )}
      </section>

      {/* Trigger Vercel Deploy */}
      <section
        style={{
          padding: "2rem",
          background: "#2d4059",
          borderRadius: "10px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
        }}
      >
        <h2 style={{ fontSize: "1.5rem" }}>🔄 Regenerate All OG HTML</h2>
        <button
          onClick={handleTriggerDeploy}
          disabled={loading}
          style={{
            marginTop: "1rem",
            padding: "1rem 2rem",
            background: "#ffc62d",
            color: "#1c2837",
            border: "none",
            borderRadius: "8px",
            fontSize: "1.25rem",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          {loading ? "Triggering..." : "Trigger Vercel Deploy"}
        </button>

        {deployStatus && (
          <pre
            style={{
              marginTop: "1rem",
              background: "#1c2837",
              color: "#ffe293",
              padding: "1rem",
              borderRadius: "6px",
              fontSize: "0.9rem",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {JSON.stringify(deployStatus, null, 2)}
          </pre>
        )}
      </section>
    </div>
  );
}
