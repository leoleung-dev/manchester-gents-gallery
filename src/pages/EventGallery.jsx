import { useParams } from 'react-router-dom'
import { useEffect, useState, useRef, useCallback } from 'react'
import { urlFor } from '@/lib/sanityClient'
import ImageModal from '../components/ImageModal'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

export default function EventGallery({ apiBase }) {
  const { slug } = useParams()
  const [photos, setPhotos] = useState([])
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [uploading, setUploading] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const fileInputRef = useRef(null)

  const API = apiBase || ''

  const loadPhotos = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/getEventPhotos?slug=${slug}`)
      if (!res.ok) throw new Error(`Failed to fetch photos: ${res.status}`)
      const data = await res.json()

      setPhotos(
        data.map(p => ({
          ...p,
          thumbnailUrl: urlFor(p.image).width(400).auto('format').url(),
          url: urlFor(p.image).width(1000).auto('format').url(),
          originalUrl: urlFor(p.image).url(),
          dateTaken: new Date(p.takenAt || p._createdAt),
        }))
      )

      setSelectedIds(prev =>
        new Set([...prev].filter(id => data.some(x => x._id === id)))
      )
    } catch (err) {
      console.error('Failed to fetch photos', err)
    }
  }, [slug, API])

  useEffect(() => {
    loadPhotos()
  }, [loadPhotos])

  useEffect(() => {
    window.addEventListener('focus', loadPhotos)
    return () => window.removeEventListener('focus', loadPhotos)
  }, [loadPhotos])

  const toggleSelect = id => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleDownloadSelected = async () => {
    if (!selectedIds.size) return
    setFeedback({ type: 'info', message: 'Preparing ZIP…' })

    const zip = new JSZip()
    const folder = zip.folder(slug)

    await Promise.all(
      [...selectedIds].map(async id => {
        const photo = photos.find(p => p._id === id)
        if (!photo) return
        try {
          const res = await fetch(photo.originalUrl, { mode: 'cors' })
          const blob = await res.blob()
          folder.file(`${photo._id}.jpg`, blob)
        } catch (err) {
          console.error('Error fetching for ZIP', id, err)
        }
      })
    )

    const content = await zip.generateAsync({ type: 'blob' })
    saveAs(content, `${slug}-photos.zip`)
    setFeedback({ type: 'success', message: 'ZIP downloaded!' })
    setTimeout(() => setFeedback(null), 3000)
  }

  const handleFileChange = async e => {
    const files = Array.from(e.target.files)
    if (!files.length) return

    setUploading(true)
    setFeedback(null)
    try {
      const form = new FormData()
      files.forEach(f => form.append('images', f))
      form.append('eventSlug', slug)

      const res = await fetch(`${API}/api/uploadImages`, {
        method: 'POST',
        body: form,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Upload failed')
      }

      setFeedback({ type: 'success', message: 'Images uploaded!' })
      await loadPhotos()
    } catch (err) {
      console.error('Upload error:', err)
      setFeedback({ type: 'error', message: err.message })
    } finally {
      setUploading(false)
      fileInputRef.current.value = null
      setTimeout(() => setFeedback(null), 3000)
    }
  }

  const currentIndex = selectedPhoto
    ? photos.findIndex(p => p._id === selectedPhoto._id)
    : -1
  const handleNext = () =>
    currentIndex < photos.length - 1 &&
    setSelectedPhoto(photos[currentIndex + 1])
  const handlePrev = () =>
    currentIndex > 0 &&
    setSelectedPhoto(photos[currentIndex - 1])

  return (
    <div className="relative max-w-6xl mx-auto p-4">
      <header className="flex flex-wrap justify-between items-center mb-4 gap-2">
        <h1 className="text-2xl font-bold">Event: {slug}</h1>
        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current.click()}
            disabled={uploading}
            className={`px-4 py-2 rounded text-white ${
              uploading ? 'bg-gray-500' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {uploading ? 'Uploading…' : 'Upload Images'}
          </button>
          <button
            onClick={handleDownloadSelected}
            disabled={!selectedIds.size}
            className="px-4 py-2 rounded bg-green-600 text-white disabled:opacity-50"
          >
            Download Selected ({selectedIds.size})
          </button>
          <button
            onClick={loadPhotos}
            className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 text-gray-800"
          >
            Refresh
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </header>

      {feedback && (
        <div
          className={`mb-4 p-2 rounded text-sm ${
            feedback.type === 'success'
              ? 'bg-green-100 text-green-800'
              : feedback.type === 'error'
              ? 'bg-red-100 text-red-800'
              : 'bg-blue-100 text-blue-800'
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Masonry Layout */}
      <div className="columns-1 sm:columns-2 md:columns-3 gap-4 space-y-4">
        {photos.map(photo => {
          const isSel = selectedIds.has(photo._id)
          return (
            <div
              key={photo._id}
              className="break-inside-avoid relative group"
            >
              <input
                type="checkbox"
                className="absolute top-2 left-2 z-20 h-5 w-5 text-green-600"
                checked={isSel}
                onChange={() => toggleSelect(photo._id)}
              />
              <div
                onClick={() =>
                  selectedIds.size > 0
                    ? toggleSelect(photo._id)
                    : setSelectedPhoto(photo)
                }
                className={`overflow-hidden rounded shadow cursor-pointer ${
                  isSel ? 'ring-4 ring-green-400' : ''
                }`}
              >
                <img
                  src={photo.thumbnailUrl}
                  alt=""
                  className="w-full object-cover hover:opacity-80 transition"
                />
                <div className="text-xs text-gray-500 px-1 pt-1">
                  {photo.dateTaken.toLocaleString()}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {selectedPhoto && (
        <ImageModal
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
          onNext={handleNext}
          onPrev={handlePrev}
          apiBase={API}
        />
      )}
    </div>
  )
}
