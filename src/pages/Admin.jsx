import { useState } from "react";
import "./Admin.css";

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

const formatTitleFromDate = (dateStr) => {
  const date = new Date(dateStr);
  const day = date.getDate();
  const month = date.toLocaleString("en-GB", { month: "long" });
  const year = date.getFullYear();
  return `${day} ${month}, ${year}`;
};

  const formatSlugFromDate = (dateStr) => {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, "0");
    const month = date.toLocaleString("en-GB", { month: "short" });
    const year = date.getFullYear();
    return `${day}${month}${year}`;
  };

  const handleDateChange = (e) => {
    const selected = e.target.value;
    if (!selected) return;

    setTitle(formatTitleFromDate(selected));
    setSlug(formatSlugFromDate(selected));
  };

  return (
    <div className="admin-container">
      <main className="admin-inner">
        {/* Return Home Button */}
        <nav className="admin-nav">
          <button
            className="admin-home-button"
            onClick={() => (window.location.href = "/")}
          >
            <span className="admin-button-content">
              <span className="admin-button-icon">⬅️</span>
              <span>Return Home</span>
            </span>
          </button>
        </nav>

        {/* Header */}
        <header className="admin-header">
          <h1 className="admin-title">🛠 Admin Panel</h1>
        </header>

        {/* Create Event Section */}
        <section className="admin-section">
          <h2 className="admin-section-title">📅 Create New Event</h2>
          <div className="admin-form-row">
            <input
              type="date"
              onChange={handleDateChange}
              className="admin-input-date"
            />
            <input
              placeholder="Event title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="admin-input"
            />
            <input
              placeholder="Slug (e.g. 26Jul2025)"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="admin-input"
            />
          </div>
          <div className="admin-form-actions">
            <button onClick={handleCreateEvent} className="admin-button">
              <span className="admin-button-content">
                <span className="admin-button-icon">➕</span>
                <span>Create Event</span>
              </span>
            </button>
          </div>
          {createStatus && (
            <pre className="admin-output">
              {JSON.stringify(createStatus, null, 2)}
            </pre>
          )}
        </section>

        {/* Deploy Section */}
        <section className="admin-section">
          <h2 className="admin-section-title">🔄 Regenerate All OG HTML</h2>
          <div className="admin-form-actions">
            <button
              onClick={handleTriggerDeploy}
              disabled={loading}
              className="admin-button large"
            >
              <span className="admin-button-content">
                <span className="admin-button-icon">🚀</span>
                <span>{loading ? "Triggering..." : "Trigger Vercel Deploy"}</span>
              </span>
            </button>
          </div>
          {deployStatus && (
            <pre className="admin-output">
              {JSON.stringify(deployStatus, null, 2)}
            </pre>
          )}
        </section>
      </main>
    </div>
  );
}