import '../lib/loadEnv.js'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { urlFor } from '@/lib/sanity'
import {
  SelectableGroup,
  createSelectable,
} from 'react-selectable-fast'

// ——— PHOTO SELECTABLE ITEM ———
const SelectablePhoto = createSelectable(
  ({ selectableRef, isSelected, onClick, photo }) => (
    <div
      ref={selectableRef}
      onClick={() => onClick(photo._id)}
      className="relative group"
      style={{
        opacity: isSelected ? 0.6 : 1,
        border: isSelected ? '2px solid #ffd460' : 'none',
      }}
    >
      <img
        src={urlFor(photo.image).width(400).height(300).fit('crop').url()}
        alt=""
        className="w-full h-40 object-cover rounded"
      />
      {isSelected && (
        <div className="absolute inset-0 bg-yellow-400 bg-opacity-30 pointer-events-none rounded" />
      )}
    </div>
  )
)

export default function AdminPanel({ apiBase }) {
  const { slug } = useParams()
  const [activeTab, setActiveTab] = useState('photos')
  const [photos, setPhotos] = useState([])
  const [comments, setComments] = useState([])
  const [selectedPhotoIds, setSelectedPhotoIds] = useState(new Set())
  const [selectedCommentIds, setSelectedCommentIds] = useState(new Set())
  const [loading, setLoading] = useState(false)
  const groupRef = useRef(null)

  const BASE = apiBase || import.meta.env.VITE_API_BASE || ''

  const loadData = useCallback(async () => {
    try {
      const res = await fetch(`${BASE}/api/getAdminData?slug=${slug}`)
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const { photos: fetchedPhotos, comments: fetchedComments } = await res.json()
      setPhotos(fetchedPhotos)
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
    <div className="p-4 max-w-5xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Admin: {slug}</h1>
        <div className="flex items-center gap-2">
          <nav className="space-x-2">
            <button
              onClick={() => setActiveTab('photos')}
              className={`px-3 py-1 rounded ${
                activeTab === 'photos' ? 'bg-gray-800 text-white' : 'bg-gray-200'
              }`}
            >
              Photos
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`px-3 py-1 rounded ${
                activeTab === 'comments' ? 'bg-gray-800 text-white' : 'bg-gray-200'
              }`}
            >
              Comments
            </button>
          </nav>
          <button
            onClick={loadData}
            className="px-3 py-1 rounded bg-gray-300 hover:bg-gray-400 text-gray-800"
          >
            Refresh
          </button>
        </div>
      </header>

      {activeTab === 'photos' ? (
        <>
          <div className="flex justify-end mb-4">
            <button
              onClick={handleBulkDeletePhotos}
              disabled={loading || !selectedPhotoIds.size}
              className="bg-red-600 text-white px-3 py-1 rounded disabled:opacity-50"
            >
              {loading ? 'Deleting…' : `Delete Photos (${selectedPhotoIds.size})`}
            </button>
          </div>
          <SelectableGroup
            ref={groupRef}
            className="grid grid-cols-4 sm:grid-cols-3 xs:grid-cols-2 gap-4"
            clickClassName="tick"
            selectionClassName="selection-rectangle"
            enableDeselect
            tolerance={0}
            onSelectionFinish={handlePhotoSelectionFinish}
            allowClickWithoutSelected
          >
            {photos.map(photo => (
              <div key={photo._id} className="relative group">
                <SelectablePhoto
                  photo={photo}
                  isSelected={selectedPhotoIds.has(photo._id)}
                  onClick={togglePhotoSelect}
                />
                <button
                  onClick={() => handleDeletePhoto(photo._id)}
                  className="absolute top-2 right-2 text-white bg-red-600 bg-opacity-80 p-1 rounded opacity-0 group-hover:opacity-100 transition"
                >
                  Delete
                </button>
              </div>
            ))}
          </SelectableGroup>
        </>
      ) : (
        <>
          <div className="flex justify-end mb-4">
            <button
              onClick={handleBulkDeleteComments}
              disabled={loading || !selectedCommentIds.size}
              className="bg-red-600 text-white px-3 py-1 rounded disabled:opacity-50"
            >
              {loading ? 'Deleting…' : `Delete Comments (${selectedCommentIds.size})`}
            </button>
          </div>
          <div className="space-y-4">
            {comments.map(c => {
              const sel = selectedCommentIds.has(c._id)
              return (
                <div key={c._id} className="flex items-start gap-4 border p-3 rounded">
                  <input
                    type="checkbox"
                    checked={sel}
                    onChange={() => toggleCommentSelect(c._id)}
                  />
                  <img
                    src={urlFor(c.photo.image).width(80).height(80).fit('crop').url()}
                    alt=""
                    className="w-20 h-20 object-cover rounded"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-medium">{c.name}</span>{' '}
                        <span className="text-gray-500">({c.instagram})</span>
                      </div>
                      <button
                        onClick={() => handleDeleteComment(c._id)}
                        className="text-red-600 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                    <p className="mt-1 text-sm">{c.message}</p>
                    <p className="mt-1 text-xs text-gray-400">
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
