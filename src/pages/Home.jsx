return (
  <div className="min-h-screen bg-[#1c2837] text-[#ffd460] p-8 max-w-3xl mx-auto text-center flex flex-col items-center">
    <img src={logo} alt="Manchester Gents" className="w-48 mb-8" />

    <h1 className="text-4xl font-bold mb-6">📸 Manchester Gents Events</h1>

    {loading ? (
      <p className="text-yellow-300 italic">Loading events…</p>
    ) : error ? (
      <p className="text-red-600">{error}</p>
    ) : events.length === 0 ? (
      <p className="text-yellow-400 italic">No events yet.</p>
    ) : (
      <div className="space-y-3 w-full">
        {events.map(event => (
          <Link
            key={event}
            to={`/event/${event}`}
            className="block text-lg font-semibold text-[#ffe293] bg-[#2d4059] hover:bg-[#3e587b] px-4 py-3 rounded shadow transition-colors"
          >
            View photos from: <strong>{event}</strong>
          </Link>
        ))}
      </div>
    )}
  </div>
)
