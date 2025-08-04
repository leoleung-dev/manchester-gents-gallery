import { useEffect, useState } from 'react'
import { FaCommentDots, FaDownload, FaTimes } from 'react-icons/fa'

export default function ImageModal({
  photo,
  onClose,
  onPrev,
  onNext,
  apiBase,
}) {
  const API = apiBase || ''

  const [name, setName] = useState(localStorage.getItem('userName') || '')
  const [instagram, setInstagram] = useState(
    localStorage.getItem('userInstagram') || ''
  )
  const [message, setMessage] = useState('')
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)
  const [showComments, setShowComments] = useState(false)

  const projectId = import.meta.env.VITE_SANITY_PROJECT_ID
  const dataset   = import.meta.env.VITE_SANITY_DATASET

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const escHandler = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', escHandler)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', escHandler)
    }
  }, [onClose])

  useEffect(() => {
    if (!photo?._id || !projectId || !dataset) return
    ;(async () => {
      try {
        const query = `*[_type=="comment" && photo._ref=="${photo._id}"]|order(createdAt desc)`
        const res = await fetch(
          `https://${projectId}.api.sanity.io/v2021-10-21/data/query/${dataset}?query=${encodeURIComponent(
            query
          )}`
        )
        const json = await res.json()
        setComments(json.result || [])
      } catch (err) {
        console.error('Failed to fetch comments', err)
      }
    })()
  }, [photo, projectId, dataset])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage(null)
    if (!name.trim() || !instagram.trim() || !message.trim()) {
      setErrorMessage('Name, Instagram and message are required.')
      return
    }
    localStorage.setItem('userName', name)
    localStorage.setItem('userInstagram', instagram)
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/addComment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          instagram,
          message,
          photoId: photo._id,
        }),
      })
      const result = await res.json()
      if (result.success) {
        setMessage('')
        setSuccess(true)
        setComments((prev) => [
          {
            _id: result.commentId,
            name,
            instagram,
            message,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ])
      } else {
        throw new Error(result.message || 'Failed to add comment')
      }
    } catch (err) {
      console.error(err)
      setSuccess(false)
    } finally {
      setLoading(false)
      setTimeout(() => {
        setSuccess(null)
        setErrorMessage(null)
      }, 3000)
    }
  }

  if (!photo) return null

  const handleOverlayClick = (e) => {
    if (e.target.id === 'modal-overlay') onClose()
  }

  return (
    <div
      id="modal-overlay"
      className="fixed inset-0 z-50 bg-black bg-opacity-90 flex flex-col items-center justify-center"
      onClick={handleOverlayClick}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white text-xl z-50"
      >
        <FaTimes />
      </button>

      <div className="relative w-full flex justify-center items-center">
        <button
          onClick={onPrev}
          className="absolute left-2 top-1/2 text-white text-3xl z-50"
        >
          ‹
        </button>
        <img
          src={photo.url}
          alt="Enlarged"
          className="max-h-[80vh] object-contain rounded"
        />
        <button
          onClick={onNext}
          className="absolute right-2 top-1/2 text-white text-3xl z-50"
        >
          ›
        </button>
      </div>

      <div className="flex gap-4 mt-4">
        <button
          onClick={async () => {
            try {
              // fetch full original file instead of resized URL
              const res = await fetch(photo.originalUrl, { mode: 'cors' })
              const blob = await res.blob()
              const link = document.createElement('a')
              link.href = URL.createObjectURL(blob)
              link.download = `${photo._id}.jpg`
              document.body.appendChild(link)
              link.click()
              document.body.removeChild(link)
            } catch (err) {
              console.error('Download failed:', err)
              alert('Failed to download image. Please try again later.')
            }
          }}
          className="bg-white text-black px-4 py-2 rounded shadow text-sm"
        >
          <FaDownload className="inline mr-1" /> Download
        </button>
        <button
          onClick={() => setShowComments(true)}
          className="bg-white text-black px-4 py-2 rounded shadow text-sm"
        >
          <FaCommentDots className="inline mr-1" /> Comment
        </button>
      </div>

      {showComments && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center">
          <div className="bg-white text-black w-full max-w-md p-4 rounded shadow-lg relative">
            <button
              onClick={() => setShowComments(false)}
              className="absolute top-2 right-2 text-gray-600"
            >
              <FaTimes />
            </button>
            <h2 className="text-lg font-semibold mb-2">Comments</h2>
            <div className="max-h-[200px] overflow-y-auto mb-4 space-y-2">
              {comments.length === 0 ? (
                <p className="text-sm italic text-gray-500">No comments yet.</p>
              ) : (
                comments.map((c, i) => (
                  <div
                    key={c._id || `${c.name}-${i}`}
                    className="border p-2 rounded text-sm"
                  >
                    <p className="font-medium">
                      {c.name}{' '}
                      {c.instagram && (
                        <span className="text-gray-500">({c.instagram})</span>
                      )}
                    </p>
                    <p>{c.message}</p>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Your name"
                className="w-full border px-2 py-1 mb-2 text-sm rounded"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                type="text"
                placeholder="@instagram"
                className="w-full border px-2 py-1 mb-2 text-sm rounded"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
              />
              <textarea
                placeholder="Write a comment..."
                className="w-full border px-2 py-1 text-sm rounded resize-none"
                rows="3"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-black text-white py-2 rounded text-sm disabled:opacity-50"
              >
                {loading ? 'Posting...' : 'Post Comment'}
              </button>
              {errorMessage && (
                <p className="text-red-600 text-sm mt-1">{errorMessage}</p>
              )}
              {success && (
                <p className="text-green-600 text-sm mt-1">Comment posted!</p>
              )}
              {success === false && (
                <p className="text-red-600 text-sm mt-1">Failed to post comment.</p>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
