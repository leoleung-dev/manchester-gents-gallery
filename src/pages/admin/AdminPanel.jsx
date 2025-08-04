import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { urlFor } from '@/lib/sanityClient'
import Logo from '@/assets/Logo.svg'
import { FaSyncAlt, FaTrashAlt } from 'react-icons/fa'
import './AdminPanel.css'

export default function AdminPanel({ apiBase }) {
  const { slug } = useParams()
  const [activeTab, setActiveTab] = useState('photos')
  const [photos, setPhotos] = useState([])
  const [selectedPhotoIds, setSelectedPhotoIds] = useState(new Set())
  const [comments, setComments] = useState([])
  const [selectedCommentIds, setSelectedCommentIds] = useState(new Set())
  const [loading, setLoading] = useState(false)

  const BASE = apiBase || import.meta.env.VITE_API_BASE || ''

  const loadData = useCallback(async () => {
    try {
      const res = await fetch(`${BASE}/api/getAdminData?slug=${slug}`)
      if (!res.ok) throw new Error(`Failed to fetch admin data`)
      const { photos: fetchedPhotos, comments: fetchedComments } = await res.json()

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

  const togglePhotoSelect = id => {
    setSelectedPhotoIds(s => {
      const newSet = new Set(s)
      newSet.has(id) ? newSet.delete(id) : newSet.add(id)
      return newSet
    })
  }

  const toggleCommentSelect = id => {
    setSelectedCommentIds(s => {
      const newSet = new Set(s)
      newSet.has(id) ? newSet.delete(id) : newSet.add(id)
      return newSet
    })
  }

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
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePhoto = async id => {
    if (!confirm('Delete this photo?')) return
    setLoading(true)
    try {
      await postJson('deletePhoto', { id })
      setPhotos(ps => ps.filter(p => p._id !== id))
      setSelectedPhotoIds(s => {
        const n = new Set(s)
        n.delete(id)
        return n
      })
    } catch (err) {
      console.error(err)
      alert('Delete photo failed: ' + err.message)
    } finally {
      setLoading(false)
    }
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
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteComment = async id => {
    if (!confirm('Delete this comment?')) return
    setLoading(true)
    try {
      await postJson('deleteComment', { id })
      setComments(cs => cs.filter(c => c._id !== id))
      setSelectedCommentIds(s => {
        const n = new Set(s)
        n.delete(id)
        return n
      })
    } catch (err) {
      console.error(err)
      alert('Delete comment failed: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSetDefaultCover = async () => {
    if (selectedPhotoIds.size !== 1) return
    const photoId = [...selectedPhotoIds][0]
    setLoading(true)
    try {
      await postJson('setCoverImage', { slug, photoId })
      alert('Default cover image set successfully')
      setSelectedPhotoIds(new Set())
      loadData()
    } catch (err) {
      console.error(err)
      alert('Failed to set cover image: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-container">
      <header className="admin-header-toolbar">
        <Link to="/" className="header-logo-link">
          <img src={Logo} alt="Manchester Gents Logo" className="header-logo" />
        </Link>
        <h1 className="admin-title">Admin: {slug}</h1>
        <div className="admin-tabs">
          <button
            onClick={() => setActiveTab('photos')}
            className={`admin-tab-button ${activeTab === 'photos' ? 'active' : ''}`}
          >
            Photos
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`admin-tab-button ${activeTab === 'comments' ? 'active' : ''}`}
          >
            Comments
          </button>
        </div>
        <button onClick={loadData} className="admin-refresh-btn" title="Refresh">
          <FaSyncAlt />
        </button>
      </header>

      {activeTab === 'photos' ? (
        <>
          {selectedPhotoIds.size === 1 && (
            <button onClick={handleSetDefaultCover} className="admin-set-cover-btn" disabled={loading}>
              {loading ? 'Setting cover…' : 'Make Default Cover Image'}
            </button>
          )}

          <button onClick={handleBulkDeletePhotos} className="admin-bulk-delete-btn" disabled={loading || !selectedPhotoIds.size}>
            {loading ? 'Deleting…' : `Delete Photos (${selectedPhotoIds.size})`}
          </button>

          <div className="admin-photos-grid">
            {photos.map(photo => (
              <div key={photo._id} className="selectable-photo-wrapper">
                <input
                  type="checkbox"
                  className="admin-photo-checkbox"
                  checked={selectedPhotoIds.has(photo._id)}
                  onChange={() => togglePhotoSelect(photo._id)}
                />
                <div
                  className={`selectable-photo ${selectedPhotoIds.has(photo._id) ? 'selected' : ''}`}
                  onClick={() => togglePhotoSelect(photo._id)}
                  tabIndex={0}
                  role="checkbox"
                  aria-checked={selectedPhotoIds.has(photo._id)}
                >
                  <img
                    src={urlFor(photo.image).width(400).height(300).fit('crop').url()}
                    alt=""
                    className="selectable-photo-image"
                  />
                </div>
                <button onClick={() => handleDeletePhoto(photo._id)} className="btn-delete-single">
                  <FaTrashAlt />
                </button>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <button onClick={handleBulkDeleteComments} className="admin-bulk-delete-btn" disabled={loading || !selectedCommentIds.size}>
            {loading ? 'Deleting…' : `Delete Comments (${selectedCommentIds.size})`}
          </button>
          <div className="comment-list">
            {comments.map(c => {
              const sel = selectedCommentIds.has(c._id)
              return (
                <div key={c._id} className="comment-item">
                  <input type="checkbox" checked={sel} onChange={() => toggleCommentSelect(c._id)} />
                  <img
                    src={urlFor(c.photo.image).width(80).height(80).fit('crop').url()}
                    alt=""
                    className="comment-photo"
                  />
                  <div className="comment-content">
                    <div className="comment-header">
                      <span className="comment-name">{c.name}</span>{' '}
                      <span className="comment-instagram">({c.instagram})</span>
                      <button onClick={() => handleDeleteComment(c._id)} className="btn-delete-comment">
                        <FaTrashAlt />
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
