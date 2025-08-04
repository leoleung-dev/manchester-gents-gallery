import { useEffect, useState } from "react";
import { FaCommentDots, FaDownload, FaTimes } from "react-icons/fa";
import "./ImageModal.css"; // new CSS file for modal styles

export default function ImageModal({
  photo,
  onClose,
  onPrev,
  onNext,
  apiBase,
}) {
  const API = apiBase || "";

  const [name, setName] = useState(localStorage.getItem("userName") || "");
  const [instagram, setInstagram] = useState(
    localStorage.getItem("userInstagram") || ""
  );
  const [message, setMessage] = useState("");
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showComments, setShowComments] = useState(false);

  const projectId = import.meta.env.VITE_SANITY_PROJECT_ID;
  const dataset = import.meta.env.VITE_SANITY_DATASET;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const escHandler = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", escHandler);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", escHandler);
    };
  }, [onClose]);

  useEffect(() => {
    if (!photo?._id || !projectId || !dataset) return;
    (async () => {
      try {
        const query = `*[_type=="comment" && photo._ref=="${photo._id}"]|order(createdAt desc)`;
        const res = await fetch(
          `https://${projectId}.api.sanity.io/v2021-10-21/data/query/${dataset}?query=${encodeURIComponent(
            query
          )}`
        );
        const json = await res.json();
        setComments(json.result || []);
      } catch (err) {
        console.error("Failed to fetch comments", err);
      }
    })();
  }, [photo, projectId, dataset]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!name.trim() || !instagram.trim() || !message.trim()) {
      setErrorMessage("Name, Instagram and message are required.");
      return;
    }
    localStorage.setItem("userName", name);
    localStorage.setItem("userInstagram", instagram);
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/addComment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, instagram, message, photoId: photo._id }),
      });
      const result = await res.json();
      if (result.success) {
        setMessage("");
        setSuccess(true);
        setComments((prev) => [
          {
            _id: result.commentId,
            name,
            instagram,
            message,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
      } else {
        throw new Error(result.message || "Failed to add comment");
      }
    } catch (err) {
      console.error(err);
      setSuccess(false);
    } finally {
      setLoading(false);
      setTimeout(() => {
        setSuccess(null);
        setErrorMessage(null);
      }, 3000);
    }
  };

  if (!photo) return null;

  const handleOverlayClick = (e) => {
    if (e.target.id === "modal-overlay") onClose();
  };

  return (
    <div
      id="modal-overlay"
      className="modal-overlay"
      onClick={handleOverlayClick}
      aria-modal="true"
      role="dialog"
      tabIndex={-1}
    >
      <div className="modal-close-btn-container">
        <button
          onClick={onClose}
          className="modal-close-btn"
          aria-label="Close modal"
        >
          <FaTimes />
        </button>
      </div>

      <div className="modal-content">
        <button
          onClick={onPrev}
          className="modal-nav-btn modal-prev"
          aria-label="Previous image"
        >
          ‹
        </button>

        <img src={photo.url} alt="Enlarged" className="modal-image" />

        <button
          onClick={onNext}
          className="modal-nav-btn modal-next"
          aria-label="Next image"
        >
          ›
        </button>
      </div>

      <div className="modal-actions">
        <button
          onClick={async () => {
            try {
              const res = await fetch(photo.originalUrl, { mode: "cors" });
              const blob = await res.blob();
              const link = document.createElement("a");
              link.href = URL.createObjectURL(blob);
              link.download = `${photo._id}.jpg`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            } catch (err) {
              console.error("Download failed:", err);
              alert("Failed to download image. Please try again later.");
            }
          }}
          className="btn btn-primary"
        >
          <FaDownload className="icon" /> Download
        </button>
        <button
          onClick={() => setShowComments(true)}
          className="btn btn-primary"
        >
          <FaCommentDots className="icon" /> Comment
        </button>
      </div>

      {showComments && (
        <div
          className="comments-overlay"
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
        >
          <div className="comments-modal">
            <button
              onClick={() => setShowComments(false)}
              className="comments-close-btn"
              aria-label="Close comments"
            >
              <FaTimes />
            </button>
            <h2 className="comments-title">Comments</h2>
            <div className="comments-list">
              {comments.length === 0 ? (
                <p className="no-comments">No comments yet.</p>
              ) : (
                comments.map((c, i) => (
                  <div key={c._id || `${c.name}-${i}`} className="comment-item">
                    <p className="comment-author">
                      {c.name}{" "}
                      {c.instagram && (
                        <span className="comment-instagram">
                          ({c.instagram})
                        </span>
                      )}
                    </p>
                    <p className="comment-message">{c.message}</p>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={handleSubmit} className="comment-form">
              <input
                type="text"
                placeholder="Your name"
                className="input-field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="@instagram"
                className="input-field"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                required
              />
              <textarea
                placeholder="Write a comment..."
                className="input-field textarea-field"
                rows="3"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary submit-btn"
              >
                {loading ? "Posting..." : "Post Comment"}
              </button>
              {errorMessage && <p className="error-message">{errorMessage}</p>}
              {success && <p className="success-message">Comment posted!</p>}
              {success === false && (
                <p className="error-message">Failed to post comment.</p>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
