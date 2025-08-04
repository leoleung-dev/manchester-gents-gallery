import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import client, { urlFor } from '@/lib/sanityClient'
import {
  SelectableGroup,
  createSelectable,
} from 'react-selectable-fast'
import './AdminPanel.css'  // import admin-specific styles

// ——— PHOTOS ———
const SelectablePhoto = createSelectable(
  ({ selectableRef, isSelected, onClick, photo }) => (
    <div
      ref={selectableRef}
      onClick={() => onClick(photo._id)}
      className={`selectable-photo ${isSelected ? 'selected' : ''}`}
    >
      <img
        src={urlFor(photo.image).width(400).height(300).fit('crop').url()}
        alt=""
        className="selectable-photo-image"
      />
      {isSelected && (
        <div className="selectable-photo-overlay" />
      )}
    </div>
  )
)

export default function AdminPanel({ apiBase }) {
  const { slug } = useParams()
  const [activeTab, setActiveTab] = useState('photos')
  const [photos, setPhotos] = useState([])
  const [selectedPhotoIds, setSelectedPhotoIds] = useState(new Set())
  const [comments, setComments] = useState([])
  const [selectedCommentIds, setSelectedCommentIds] = useState(new Set())
  const [loading, setLoading] = useState(false)
  const groupRef = useRef(null)

  const BASE = apiBase || import.meta.env.VITE_API_BASE || ''

  const loadData = useCallback(async () => {
    try {
      const [fetchedPhotos, fetchedComments] = await Promise.all([
        client.fetch(
          `*[_type=="photo" && eventSlug==$slug]{
             _id, image, takenAt, _createdAt
           } | order(takenAt desc)`,
          { slug }
        ),
        client.fetch(
          `*[_type=="comment" && photo->eventSlug==$slug]{
             _id, name, instagram, message, createdAt, photo->{image}
           } | order(createdAt desc)`,
          { slug }
        ),
      ])
      setPhotos(
        fetchedPhotos.map(p => ({
          ...p,
          dateTaken: new Date(p.takenAt || p._createdAt),
        }))
      )
      setComments(fetchedComments)
      setSelectedPhotoIds(new Set())
      setSelectedCommentIds(new Set())
    } catch (err) {
      console.error('loadData error:', err)
    }
  }, [slug])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    window.addEventListener('focus', loadData)
    return () => window.removeEventListener('focus', loadData)
  }, [loadData])

  // selection helpers
  const handlePhotoSelectionFinish = items =>
    setSelectedPhotoIds(new Set(items.map(i => i.props.photo._id)))
  const togglePhotoSelect = id =>
    setSelectedPhotoIds(s => {
      const n = new Set(s)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  const toggleCommentSelect = id =>
    setSelectedCommentIds(s => {
      const n = new Set(s)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })

  // CTRL+A to select all
  useEffect(() => {
    const onKey = e => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        e.preventDefault()
        if (activeTab === 'photos') {
          setSelectedPhotoIds(new Set(photos.map(p => p._id)))
        } else {
          setSelectedCommentIds(new Set(comments.map(c => c._id)))
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activeTab, photos, comments])

  async function postJson(path, body) {
    const res = await fetch(`${BASE}/api/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      let msg = `${res.status} ${res.statusText}`
      try {
        const err = await res.json()
        msg = err.message || JSON.stringify(err)
      } catch {}
      throw new Error(msg)
    }
    return res.json()
  }

  // Bulk and single deletes
  const handleBulkDeletePhotos = async () => {
    if (!selectedPhotoIds.size || !confirm(`Delete ${selectedPhotoIds.size} photo(s)?`)) return
    setLoading(true)
    try {
      await postJson('bulkDeletePhoto', { ids: [...selectedPhotoIds] })
      setPhotos(ps => ps.filter(p => !selectedPhotoIds.has(p._id)))
      setSelectedPhotoIds(new Set())
    } catch (err) {
      console.error(err)
      alert('Bulk delete photos failed: ' + err.message)
    } finally { setLoading(false) }
  }
  const handleDeletePhoto = async id => {
    if (!confirm('Delete this photo?')) return
    setLoading(true)
    try {
      await postJson('deletePhoto', { id })
      setPhotos(ps => ps.filter(p => p._id !== id))
      setSelectedPhotoIds(s => { const n = new Set(s); n.delete(id); return n })
    } catch (err) {
      console.error(err)
      alert('Delete photo failed: ' + err.message)
    } finally { setLoading(false) }
  }

  const handleBulkDeleteComments = async () => {
    if (!selectedCommentIds.size || !confirm(`Delete ${selectedCommentIds.size} comment(s)?`)) return
    setLoading(true)
    try {
      await postJson('bulkDeleteComment', { ids: [...selectedCommentIds] })
      setComments(cs => cs.filter(c => !selectedCommentIds.has(c._id)))
      setSelectedCommentIds(new Set())
    } catch (err) {
      console.error(err)
      alert('Bulk delete comments failed: ' + err.message)
    } finally { setLoading(false) }
  }
  const handleDeleteComment = async id => {
    if (!confirm('Delete this comment?')) return
    setLoading(true)
    try {
      await postJson('deleteComment', { id })
      setComments(cs => cs.filter(c => c._id !== id))
      setSelectedCommentIds(s => { const n = new Set(s); n.delete(id); return n })
    } catch (err) {
      console.error(err)
      alert('Delete comment failed: ' + err.message)
    } finally { setLoading(false) }
  }

  return (
    <div className="admin-panel-container">
      <header className="admin-panel-header">
        <h1 className="admin-panel-title">Admin: {slug}</h1>
        <div className="admin-panel-controls">
          <nav className="admin-panel-nav">
            <button
              onClick={() => setActiveTab('photos')}
              className={`admin-panel-tab ${activeTab === 'photos' ? 'active' : ''}`}
            >
              Photos
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`admin-panel-tab ${activeTab === 'comments' ? 'active' : ''}`}
            >
              Comments
            </button>
          </nav>
          <button onClick={loadData} className="btn-refresh">
            Refresh
          </button>
        </div>
      </header>

      {activeTab === 'photos' ? (
        <>
          <div className="bulk-delete-container">
            <button
              onClick={handleBulkDeletePhotos}
              disabled={loading || !selectedPhotoIds.size}
              className="btn-delete"
            >
              {loading ? 'Deleting…' : `Delete Photos (${selectedPhotoIds.size})`}
            </button>
          </div>
          <SelectableGroup
            ref={groupRef}
            className="photo-grid"
            clickClassName="tick"
            selectionClassName="selection-rectangle"
            enableDeselect
            tolerance={0}
            onSelectionFinish={handlePhotoSelectionFinish}
            allowClickWithoutSelected
          >
            {photos.map(photo => (
              <div key={photo._id} className="photo-grid-item group">
                <SelectablePhoto
                  photo={photo}
                  isSelected={selectedPhotoIds.has(photo._id)}
                  onClick={togglePhotoSelect}
                />
                <button
                  onClick={() => handleDeletePhoto(photo._id)}
                  className="btn-delete-single"
                >
                  Delete
                </button>
              </div>
            ))}
          </SelectableGroup>
        </>
      ) : (
        <>
          <div className="bulk-delete-container">
            <button
              onClick={handleBulkDeleteComments}
              disabled={loading || !selectedCommentIds.size}
              className="btn-delete"
            >
              {loading ? 'Deleting…' : `Delete Comments (${selectedCommentIds.size})`}
            </button>
          </div>
          <div className="comment-list">
            {comments.map(c => {
              const sel = selectedCommentIds.has(c._id)
              return (
                <div key={c._id} className="comment-item">
                  <input
                    type="checkbox"
                    checked={sel}
                    onChange={() => toggleCommentSelect(c._id)}
                  />
                  <img
                    src={urlFor(c.photo.image).width(80).height(80).fit('crop').url()}
                    alt=""
                    className="comment-photo"
                  />
                  <div className="comment-content">
                    <div className="comment-header">
                      <span className="comment-name">{c.name}</span>{' '}
                      <span className="comment-instagram">({c.instagram})</span>
                      <button
                        onClick={() => handleDeleteComment(c._id)}
                        className="btn-delete-comment"
                      >
                        Delete
                      </button>
                    </div>
                    <p className="comment-message">{c.message}</p>
                    <p className="comment-date">
                      {new Date(c.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
