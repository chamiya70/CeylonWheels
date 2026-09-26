'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'

interface ListingImage {
  imageId?: string
  imageUrl?: string
  url?: string
}

interface Listing {
  listingId: string
  title: string
  make: string
  model: string
  year: number
  price: number
  type: string
  status: string
  sellerId: string
  images?: (ListingImage | string)[]
}

export default function Home() {
  const [listings, setListings] = useState<Listing[]>([])
  const [searchMake, setSearchMake] = useState('')
  const [filterType, setFilterType] = useState('ALL')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Modals & User state
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [isLoginMode, setIsLoginMode] = useState(true)
  const [addCarModalOpen, setAddCarModalOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  // Auth Form State
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    role: 'PRIVATE_SELLER',
    phone: '',
    businessName: '',
    businessRegNo: '',
  })

  // New Listing Form State
  const [carForm, setCarForm] = useState({
    title: '',
    make: '',
    model: '',
    year: 2020,
    price: 5000000,
    type: 'SEDAN',
    lat: 6.9271,
    lng: 79.8612,
    imageUrl: '',
  })

  // 1. Fetch Listings
  const fetchListings = async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const url = searchMake.trim()
        ? `/api/listing?make=${encodeURIComponent(searchMake.trim())}`
        : '/api/listing'
      const res = await fetch(url)
      const data = await res.json()
      if (Array.isArray(data)) {
        setListings(data)
      } else {
        setListings([])
      }
    } catch {
      setErrorMsg('Failed to load listings from server.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchListings()
  }, [])

  // 2. Handle Login & Signup
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    const endpoint = isLoginMode ? '/api/auth/login' : '/api/auth/signup'

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm),
      })
      const data = await res.json()

      if (!res.ok) {
        alert(data.error || 'Authentication failed')
        return
      }

      alert(isLoginMode ? 'Logged in successfully!' : 'Signed up successfully!')
      setCurrentUser(data.user)
      setAuthModalOpen(false)
    } catch {
      alert('Authentication request failed.')
    }
  }

  // Handle local image file picker and convert to Base64 Data URL
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Limit to 2MB to keep PostgreSQL rows lean
    if (file.size > 2 * 1024 * 1024) {
      alert('Please choose an image under 2MB.')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setCarForm((prev) => ({
        ...prev,
        imageUrl: reader.result as string,
      }))
    }
    reader.readAsDataURL(file)
  }

  // 3. Handle Add New Listing
  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault()
    const sellerId =
      currentUser?.sellerProfile?.sellerId ||
      currentUser?.dealerProfile?.dealerId ||
      currentUser?.userId

    if (!sellerId) {
      alert('Please log in as a seller first to create a listing.')
      return
    }

    try {
      const res = await fetch('/api/listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...carForm,
          year: Number(carForm.year),
          price: Number(carForm.price),
          sellerId,
          images: carForm.imageUrl.trim() ? [carForm.imageUrl.trim()] : [],
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        alert(data.error || 'Failed to create listing')
        return
      }

      alert('Car listed successfully!')
      setAddCarModalOpen(false)
      setCarForm({
        title: '',
        make: '',
        model: '',
        year: 2020,
        price: 5000000,
        type: 'SEDAN',
        lat: 6.9271,
        lng: 79.8612,
        imageUrl: '',
      })
      fetchListings()
    } catch {
      alert('Error creating listing')
    }
  }

  // 4. Handle Delete Listing
  const handleDeleteListing = async (listingId: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return

    try {
      const res = await fetch(`/api/listing?id=${listingId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        alert('Failed to delete listing')
        return
      }
      setListings((prev) => prev.filter((item) => item.listingId !== listingId))
      alert('Listing deleted successfully!')
    } catch {
      alert('Delete request failed')
    }
  }

  const filteredListings = listings.filter((item) =>
    filterType === 'ALL' ? true : item.type === filterType
  )

  // Helper to extract image URL safely
  const getCarImageUrl = (car: Listing): string | null => {
    if (!car.images || car.images.length === 0) return null
    const firstImg = car.images[0]
    if (typeof firstImg === 'string') return firstImg
    return firstImg.imageUrl || firstImg.url || null
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/70 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-tight text-amber-500">
              CeylonWheels
            </span>
          </div>

          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-300">
                  {currentUser.email}
                </span>
                <button
                  onClick={() => setAddCarModalOpen(true)}
                  className="bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm px-4 py-2 rounded-lg transition"
                >
                  + Post Car
                </button>
                <button
                  onClick={() => setCurrentUser(null)}
                  className="border border-slate-700 hover:bg-slate-800 text-sm px-3 py-2 rounded-lg transition"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm px-4 py-2 rounded-lg transition"
              >
                Sign In / Register
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero & Search Filter */}
      <section className="max-w-7xl mx-auto px-4 pt-10 pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
          Find Your Next Ride in Sri Lanka
        </h1>
        <p className="text-slate-400 mb-6">
          Search genuine vehicles directly from verified sellers and business dealers.
        </p>

        <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 flex flex-wrap gap-4 items-center">
          <input
            type="text"
            placeholder="Search by Make (e.g. Toyota, Honda)..."
            value={searchMake}
            onChange={(e) => setSearchMake(e.target.value)}
            className="flex-1 min-w-[240px] bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">All Types</option>
            <option value="SEDAN">Sedan</option>
            <option value="SUV">SUV</option>
            <option value="HATCHBACK">Hatchback</option>
          </select>
          <button
            onClick={fetchListings}
            className="bg-slate-700 hover:bg-slate-600 px-5 py-2 rounded-lg text-sm font-semibold transition"
          >
            Apply Filter
          </button>
        </div>
      </section>

      {/* Car Listings Grid */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-20 text-slate-400">Loading listings...</div>
        ) : errorMsg ? (
          <div className="text-center py-20 text-red-400">{errorMsg}</div>
        ) : filteredListings.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-slate-800 rounded-2xl">
            <p className="text-slate-400">No car listings found in the database.</p>
            {currentUser && (
              <button
                onClick={() => setAddCarModalOpen(true)}
                className="mt-4 text-amber-500 underline text-sm hover:text-amber-400"
              >
                Create the first listing now
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((car) => {
              const imageUrl = getCarImageUrl(car)
              return (
                <div
                  key={car.listingId}
                  className="bg-slate-800/60 rounded-xl border border-slate-700 overflow-hidden flex flex-col justify-between"
                >
                  {/* Clickable Image -> Navigates to /listing/[id] */}
                  <Link href={`/listing/${car.listingId}`}>
                    <div className="h-48 bg-slate-900 relative overflow-hidden flex items-center justify-center cursor-pointer">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={car.title}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-500 gap-2">
                          <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-xs font-medium text-slate-500">No Image Available</span>
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-1">
                        {/* Clickable Title -> Navigates to /listing/[id] */}
                        <Link href={`/listing/${car.listingId}`}>
                          <h2 className="font-bold text-lg text-white leading-snug hover:text-amber-400 transition cursor-pointer">
                            {car.title}
                          </h2>
                        </Link>
                        <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-mono font-semibold">
                          {car.type}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mb-3">Year: {car.year}</p>
                      <p className="text-xl font-black text-amber-400">
                        LKR {Number(car.price).toLocaleString()}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between">
                      <span className="text-xs font-mono text-slate-500 truncate max-w-[150px]">
                        ID: {car.listingId.slice(0, 8)}...
                      </span>
                      <button
                        onClick={() => handleDeleteListing(car.listingId)}
                        className="text-red-400 hover:text-red-300 text-xs font-semibold px-2 py-1 rounded hover:bg-red-500/10 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Auth Modal */}
      {authModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4 text-white">
              {isLoginMode ? 'Sign In to CeylonWheels' : 'Create Seller Account'}
            </h2>
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={authForm.email}
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {!isLoginMode && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Role</label>
                    <select
                      value={authForm.role}
                      onChange={(e) => setAuthForm({ ...authForm, role: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="PRIVATE_SELLER">Private Seller</option>
                      <option value="BUSINESS_DEALER">Business Dealer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Phone</label>
                    <input
                      type="text"
                      placeholder="+94771234567"
                      value={authForm.phone}
                      onChange={(e) => setAuthForm({ ...authForm, phone: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-semibold py-2 rounded-lg text-sm transition"
                >
                  {isLoginMode ? 'Sign In' : 'Sign Up'}
                </button>
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(false)}
                  className="px-4 py-2 border border-slate-700 hover:bg-slate-700 text-sm rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>

            <p className="text-center text-xs text-slate-400 mt-4">
              {isLoginMode ? "Don't have an account?" : 'Already registered?'}{' '}
              <button
                type="button"
                onClick={() => setIsLoginMode(!isLoginMode)}
                className="text-amber-400 hover:underline"
              >
                {isLoginMode ? 'Sign Up' : 'Log In'}
              </button>
            </p>
          </div>
        </div>
      )}

      {/* Add Car Listing Modal */}
      {addCarModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-white">Post New Car Listing</h2>
            <form onSubmit={handleCreateListing} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Listing Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Toyota Premio G-Superior 2019"
                  value={carForm.title}
                  onChange={(e) => setCarForm({ ...carForm, title: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Image File Picker & Preview */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Upload Car Photo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="w-full text-xs text-slate-300 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-700 file:text-amber-400 hover:file:bg-slate-600 cursor-pointer bg-slate-900 border border-slate-700 rounded-lg p-1.5"
                />

                {carForm.imageUrl && (
                  <div className="mt-2 h-36 w-full rounded-lg overflow-hidden border border-slate-700 bg-slate-900">
                    <img
                      src={carForm.imageUrl}
                      alt="Car Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Make</label>
                  <input
                    type="text"
                    required
                    placeholder="Toyota"
                    value={carForm.make}
                    onChange={(e) => setCarForm({ ...carForm, make: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Model</label>
                  <input
                    type="text"
                    required
                    placeholder="Premio"
                    value={carForm.model}
                    onChange={(e) => setCarForm({ ...carForm, model: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Year</label>
                  <input
                    type="number"
                    value={carForm.year}
                    onChange={(e) => setCarForm({ ...carForm, year: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Price (LKR)</label>
                  <input
                    type="number"
                    value={carForm.price}
                    onChange={(e) => setCarForm({ ...carForm, price: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Type</label>
                  <select
                    value={carForm.type}
                    onChange={(e) => setCarForm({ ...carForm, type: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="SEDAN">SEDAN</option>
                    <option value="SUV">SUV</option>
                    <option value="HATCHBACK">HATCHBACK</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-semibold py-2 rounded-lg text-sm transition"
                >
                  Publish Listing
                </button>
                <button
                  type="button"
                  onClick={() => setAddCarModalOpen(false)}
                  className="px-4 py-2 border border-slate-700 hover:bg-slate-700 text-sm rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}