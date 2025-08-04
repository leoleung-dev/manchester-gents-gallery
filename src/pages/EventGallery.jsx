// src/pages/EventGallery.jsx
import { useParams, Link } from "react-router-dom";
import { useEffect, useState, useRef, useCallback } from "react";
import { urlFor } from "@/lib/sanityClient";
import ImageModal from "../components/ImageModal";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import Masonry from "react-masonry-css";
import "./EventGallery.css";
import Logo from "@/assets/Logo.svg"; // adjust path if needed
import { FaUpload, FaDownload, FaSyncAlt } from "react-icons/fa"; // import font awesome icons

export default function EventGallery({ apiBase }) {
  const { slug } = useParams();
  const [photos, setPhotos] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const API = apiBase || "";

  const loadPhotos = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/getEventPhotos?slug=${slug}`);
      if (!res.ok) throw new Error(`Failed to fetch photos: ${res.status}`);
      const data = await res.json();

      setPhotos(
        data.map((p) => ({
          ...p,
          thumbnailUrl: urlFor(p.image).width(400).auto("format").url(),
          url: urlFor(p.image).width(1000).auto("format").url(),
          originalUrl: urlFor(p.image).url(),
          dateTaken: new Date(p.takenAt || p._createdAt),
        }))
      );

      setSelectedIds(
        (prev) =>
          new Set([...prev].filter((id) => data.some((x) => x._id === id)))
      );
    } catch (err) {
      console.error("Failed to fetch photos", err);
    }
  }, [slug, API]);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  useEffect(() => {
    window.addEventListener("focus", loadPhotos);
    return () => window.removeEventListener("focus", loadPhotos);
  }, [loadPhotos]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleDownloadSelected = async () => {
    if (!selectedIds.size) return;
    setFeedback({ type: "info", message: "Preparing ZIP…" });

    const zip = new JSZip();
    const folder = zip.folder(slug);

    await Promise.all(
      [...selectedIds].map(async (id) => {
        const photo = photos.find((p) => p._id === id);
        if (!photo) return;
        try {
          const res = await fetch(photo.originalUrl, { mode: "cors" });
          const blob = await res.blob();
          folder.file(`${photo._id}.jpg`, blob);
        } catch (err) {
          console.error("Error fetching for ZIP", id, err);
        }
      })
    );

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `${slug}-photos.zip`);
    setFeedback({ type: "success", message: "ZIP downloaded!" });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploading(true);
    setUploadProgress(0);
    setFeedback({ type: "info", message: "Uploading images…" });

    let successCount = 0;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const form = new FormData();
        form.append("file", file);
        form.append("eventSlug", slug);

        const res = await fetch(
          "https://manchester-gents-gallery-uploadserver-production.up.railway.app/upload",
          {
            method: "POST",
            body: form,
          }
        );

        if (res.ok) {
          successCount++;
        } else {
          const err = await res.json().catch(() => ({}));
          console.error("Upload error:", err);
        }

        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      }

      if (successCount > 0) {
        setFeedback({
          type: "success",
          message: `${successCount} image(s) uploaded!`,
        });
        await loadPhotos();
      } else {
        throw new Error("All uploads failed.");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setFeedback({ type: "error", message: err.message || "Upload failed" });
    } finally {
      setUploading(false);
      setUploadProgress(0);
      fileInputRef.current.value = null;
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const currentIndex = selectedPhoto
    ? photos.findIndex((p) => p._id === selectedPhoto._id)
    : -1;
  const handleNext = () =>
    currentIndex < photos.length - 1 &&
    setSelectedPhoto(photos[currentIndex + 1]);
  const handlePrev = () =>
    currentIndex > 0 && setSelectedPhoto(photos[currentIndex - 1]);

  const breakpointColumnsObj = {
    default: 3,
    768: 2,
    480: 2,
  };

  return (
    <div className="event-gallery-container">
      {uploading && (
        <div className="upload-overlay">
          <div className="upload-progress-box">
            Uploading images…
            <div className="upload-bar-wrapper">
              <div
                className="upload-bar"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <div style={{ marginTop: "0.5rem" }}>{uploadProgress}%</div>
          </div>
        </div>
      )}

      <header className="header-toolbar">
        <Link to="/" className="header-logo-link">
          <img src={Logo} alt="Manchester Gents Logo" className="header-logo" />
        </Link>
        <h1 className="event-gallery-title">Event: {slug}</h1>
        <div className="event-gallery-buttons">
          <button
            onClick={() => fileInputRef.current.click()}
            disabled={uploading}
            className={`btn-upload ${uploading ? "btn-disabled" : ""}`}
            aria-label="Upload Images"
            title="Upload Images"
          >
            <FaUpload size={18} />
          </button>

          <button
            onClick={handleDownloadSelected}
            disabled={!selectedIds.size}
            className="btn-download"
            aria-label={`Download Selected (${selectedIds.size})`}
            title={`Download Selected (${selectedIds.size})`}
          >
            <FaDownload size={18} />
            <span className="download-count">{selectedIds.size}</span>
          </button>

          <button
            onClick={loadPhotos}
            className="btn-refresh"
            aria-label="Refresh"
            title="Refresh"
          >
            <FaSyncAlt size={18} />
          </button>
        </div>
      </header>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {feedback && (
        <div className={`feedback-message feedback-${feedback.type}`}>
          {feedback.message}
        </div>
      )}

      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="masonry-grid"
        columnClassName="masonry-column"
      >
        {photos.map((photo) => {
          const isSel = selectedIds.has(photo._id);
          return (
            <div key={photo._id} className="photo-card">
              <input
                type="checkbox"
                className="photo-checkbox"
                checked={isSel}
                onChange={() => toggleSelect(photo._id)}
              />
              <div
                onClick={() =>
                  selectedIds.size > 0
                    ? toggleSelect(photo._id)
                    : setSelectedPhoto(photo)
                }
                className={`photo-image-container ${
                  isSel ? "photo-selected" : ""
                }`}
              >
                <img src={photo.thumbnailUrl} alt="" className="photo-image" />
                <div className="photo-date">
                  {photo.dateTaken.toLocaleString()}
                </div>
              </div>
            </div>
          );
        })}
      </Masonry>

{selectedPhoto && (
  <>
    <style>{`.header-toolbar { display: none !important; }`}</style>
    <ImageModal
      photo={selectedPhoto}
      onClose={() => setSelectedPhoto(null)}
      onNext={handleNext}
      onPrev={handlePrev}
      apiBase={API}
    />
  </>
)}
    </div>
  );
}
