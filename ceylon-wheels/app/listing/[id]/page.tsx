'use client'

import React, { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface ImageRecord {
    imageId: string
    imageUrl: string
}

interface ListingData {
    listingId: string
    title: string
    make: string
    model: string
    year: number
    price: number
    type: string
    status: string
    description?: string | null
    images: ImageRecord[]
    seller?: {
        user?: {
            email: string
            phone?: string
        }
    }
}

export default function ListingDetailPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = use(params)
    const router = useRouter()

    const [listing, setListing] = useState<ListingData | null>(null)
    const [loading, setLoading] = useState(true)
    const [selectedImage, setSelectedImage] = useState<string | null>(null)
    const [isManageModalOpen, setIsManageModalOpen] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [editingDescription, setEditingDescription] = useState('')
    const [isUpdatingDesc, setIsUpdatingDesc] = useState(false)

    // Fetch listing data
    const loadListing = async () => {
        try {
            const res = await fetch('/api/listing')
            const listings: ListingData[] = await res.json()
            const found = listings.find((item) => item.listingId === id)
            if (found) {
                setListing(found)
                setEditingDescription(found.description || '')
                if (found.images && found.images.length > 0) {
                    setSelectedImage(found.images[0].imageUrl)
                }
            }
        } catch (err) {
            console.error('Failed to load listing', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadListing()
    }, [id])

    // Update vehicle description
    const handleUpdateDescription = async () => {
        setIsUpdatingDesc(true)
        try {
            const res = await fetch('/api/listing', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    listingId: id,
                    description: editingDescription,
                }),
            })
            if (!res.ok) throw new Error('Update failed')
            await loadListing()
            alert('Description updated successfully!')
        } catch {
            alert('Failed to update description.')
        } finally {
            setIsUpdatingDesc(false)
        }
    }

    // Upload new photo to this listing
    const handleAddNewPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 2 * 1024 * 1024) {
            alert('Please upload an image smaller than 2MB.')
            return
        }

        const reader = new FileReader()
        reader.onloadend = async () => {
            const base64Url = reader.result as string
            setIsUploading(true)
            try {
                const res = await fetch('/api/listing', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        listingId: id,
                        images: [base64Url],
                    }),
                })

                if (!res.ok) throw new Error('Upload failed')
                await loadListing()
            } catch (err) {
                alert('Failed to upload new photo.')
            } finally {
                setIsUploading(false)
            }
        }
        reader.readAsDataURL(file)
    }

    // Delete an individual image
    const handleDeletePhoto = async (imageId: string) => {
        if (!confirm('Are you sure you want to remove this photo?')) return

        try {
            const res = await fetch(`/api/listing/image?imageId=${imageId}`, {
                method: 'DELETE',
            })
            if (!res.ok) throw new Error('Delete failed')
            await loadListing()
        } catch (err) {
            alert('Failed to remove image.')
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 text-slate-400 flex items-center justify-center font-sans">
                Loading car details...
            </div>
        )
    }

    if (!listing) {
        return (
            <div className="min-h-screen bg-slate-900 text-slate-300 flex flex-col items-center justify-center font-sans gap-4">
                <p className="text-xl">Listing not found</p>
                <Link href="/" className="text-amber-400 underline">
                    Return to Inventory
                </Link>
            </div>
        )
    }

    const sellerPhone = listing.seller?.user?.phone || null
    const cleanPhone = sellerPhone ? sellerPhone.replace(/[^0-9]/g, '') : null

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-16">
            {/* Header */}
            <header className="border-b border-slate-800 bg-slate-950/70 backdrop-blur sticky top-0 z-30">
                <div className="w-full px-6 lg:px-12 h-16 flex items-center justify-between">
                    <Link href="/" className="text-2xl font-black tracking-tight text-amber-500">
                        CeylonWheels
                    </Link>
                    <Link
                        href="/"
                        className="text-sm font-medium text-slate-400 hover:text-white transition"
                    >
                        ← Back to Inventory
                    </Link>
                </div>
            </header>

            <main className="w-full px-6 lg:px-12 pt-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Visuals & Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Primary Main Photo Display */}
                        <div className="h-[460px] w-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center relative shadow-lg">
                            {selectedImage ? (
                                <img
                                    src={selectedImage}
                                    alt={listing.title}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center text-slate-500 gap-2">
                                    <svg className="w-12 h-12 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span className="text-sm font-medium text-slate-500">No Image Available</span>
                                </div>
                            )}

                            {/* Quick Manage Photos Button Overlay */}
                            <button
                                onClick={() => setIsManageModalOpen(true)}
                                className="absolute top-4 right-4 bg-slate-900/80 hover:bg-slate-800 text-amber-400 border border-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg shadow backdrop-blur transition cursor-pointer"
                            >
                                📷 Manage Photos ({listing.images?.length || 0})
                            </button>
                        </div>

                        {/* Clickable Image Strip / Carousel */}
                        {listing.images && listing.images.length > 0 && (
                            <div className="flex gap-3 overflow-x-auto pb-2">
                                {listing.images.map((img) => (
                                    <button
                                        key={img.imageId}
                                        onClick={() => setSelectedImage(img.imageUrl)}
                                        className={`h-24 w-32 shrink-0 rounded-xl overflow-hidden border-2 transition cursor-pointer ${selectedImage === img.imageUrl
                                                ? 'border-amber-500 scale-95 shadow-md shadow-amber-500/20'
                                                : 'border-slate-800 hover:border-slate-600'
                                            }`}
                                    >
                                        <img
                                            src={img.imageUrl}
                                            alt="Thumbnail"
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Specifications Card */}
                        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6">
                            <h2 className="text-xl font-bold text-white mb-4">Vehicle Overview</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/60">
                                    <span className="text-slate-400 block text-xs">Make</span>
                                    <span className="font-semibold text-white">{listing.make}</span>
                                </div>
                                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/60">
                                    <span className="text-slate-400 block text-xs">Model</span>
                                    <span className="font-semibold text-white">{listing.model}</span>
                                </div>
                                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/60">
                                    <span className="text-slate-400 block text-xs">Year</span>
                                    <span className="font-semibold text-white">{listing.year}</span>
                                </div>
                                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/60">
                                    <span className="text-slate-400 block text-xs">Body Type</span>
                                    <span className="font-semibold text-white">{listing.type}</span>
                                </div>
                            </div>
                        </div>

                        {/* Vehicle Description Section */}
                        {listing.description ? (
                            <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6">
                                <h2 className="text-xl font-bold text-white mb-3">Vehicle Description</h2>
                                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                                    {listing.description}
                                </p>
                            </div>
                        ) : null}
                    </div>

                    {/* Pricing & Contact Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 space-y-6">
                            <div>
                                <span className="text-xs uppercase tracking-wider font-mono text-amber-400 font-semibold">
                                    {listing.status}
                                </span>
                                <h1 className="text-2xl font-black text-white mt-1">{listing.title}</h1>
                                <p className="text-3xl font-black text-amber-400 mt-3">
                                    LKR {Number(listing.price).toLocaleString()}
                                </p>
                            </div>

                            <div className="border-t border-slate-700 pt-4 space-y-3">
                                <h3 className="text-sm font-semibold text-slate-300">Seller Details</h3>
                                <p className="text-sm text-slate-400 truncate">
                                    Email: <span className="text-slate-200">{listing.seller?.user?.email || 'N/A'}</span>
                                </p>
                                {sellerPhone && (
                                    <p className="text-sm text-slate-400">
                                        Phone: <span className="text-slate-200">{sellerPhone}</span>
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2 pt-2">
                                {cleanPhone && (
                                    <>
                                        <a
                                            href={`tel:${cleanPhone}`}
                                            className="block w-full py-3 bg-amber-500 hover:bg-amber-400 text-black text-center font-bold rounded-xl transition text-sm"
                                        >
                                            Call Seller
                                        </a>
                                        <a
                                            href={`https://wa.me/${cleanPhone}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-center font-bold rounded-xl transition text-sm"
                                        >
                                            WhatsApp Message
                                        </a>
                                    </>
                                )}
                                <button
                                    onClick={() => setIsManageModalOpen(true)}
                                    className="block w-full py-3 bg-slate-700 hover:bg-slate-600 text-amber-300 text-center font-semibold rounded-xl transition text-sm cursor-pointer"
                                >
                                    Edit / Manage Photos
                                </button>
                                <Link
                                    href="/"
                                    className="block w-full py-3 border border-slate-700 hover:bg-slate-800 text-slate-300 text-center font-semibold rounded-xl transition text-sm"
                                >
                                    Browse More Listings
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Photo Manager Modal */}
            {isManageModalOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-xl p-6 max-h-[85vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-white">Manage Vehicle Details & Photos</h2>
                            <button
                                onClick={() => setIsManageModalOpen(false)}
                                className="text-slate-400 hover:text-white text-sm cursor-pointer"
                            >
                                ✕ Close
                            </button>
                        </div>

                        {/* Edit Description Section */}
                        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 mb-4">
                            <label className="block text-xs font-semibold text-slate-300 mb-2">
                                Vehicle Description & Seller Details
                            </label>
                            <textarea
                                rows={3}
                                placeholder="Add or update vehicle details (condition, mileage, options, seller notes)..."
                                value={editingDescription}
                                onChange={(e) => setEditingDescription(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 placeholder:text-slate-500 resize-none mb-2"
                            />
                            <div className="flex justify-end">
                                <button
                                    onClick={handleUpdateDescription}
                                    disabled={isUpdatingDesc}
                                    className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold text-xs px-3.5 py-1.5 rounded-lg transition cursor-pointer"
                                >
                                    {isUpdatingDesc ? 'Saving...' : 'Save Description'}
                                </button>
                            </div>
                        </div>

                        {/* Upload New Section */}
                        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 mb-4">
                            <label className="block text-xs font-semibold text-slate-300 mb-2">
                                Add Another Photo
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                disabled={isUploading}
                                onChange={handleAddNewPhoto}
                                className="w-full text-xs text-slate-300 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-700 file:text-amber-400 hover:file:bg-slate-600 cursor-pointer bg-slate-950 border border-slate-800 rounded-lg p-1.5"
                            />
                            {isUploading && (
                                <p className="text-xs text-amber-400 mt-2">Uploading photo...</p>
                            )}
                        </div>

                        {/* Existing Photos List */}
                        <p className="text-xs text-slate-400 mb-2 font-medium">
                            Current Photos ({listing.images?.length || 0})
                        </p>
                        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                            {(!listing.images || listing.images.length === 0) && (
                                <p className="text-xs text-slate-500 py-6 text-center">
                                    No photos uploaded yet. Use the selector above to add one.
                                </p>
                            )}
                            {listing.images?.map((img) => (
                                <div
                                    key={img.imageId}
                                    className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-700"
                                >
                                    <img
                                        src={img.imageUrl}
                                        alt="Car thumb"
                                        className="h-16 w-24 object-cover rounded-lg border border-slate-800"
                                    />
                                    <button
                                        onClick={() => handleDeletePhoto(img.imageId)}
                                        className="text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer"
                                    >
                                        Delete Photo
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}