import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function ListingDetailPage({ params }: PageProps) {
    const { id } = await params

    const listing = await db.listing.findUnique({
        where: { listingId: id },
        include: {
            images: true,
            seller: {
                include: {
                    user: {
                        select: {
                            email: true,
                            phone: true,
                        },
                    },
                },
            },
        },
    })

    if (!listing) {
        notFound()
    }

    const primaryImage = listing.images?.[0]?.imageUrl || null
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
                        <div className="h-[420px] w-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
                            {primaryImage ? (
                                <img
                                    src={primaryImage}
                                    alt={listing.title}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="text-slate-500 text-base font-medium">
                                    {listing.make} {listing.model}
                                </div>
                            )}
                        </div>

                        {/* Additional Photos strip */}
                        {listing.images && listing.images.length > 1 && (
                            <div className="grid grid-cols-4 gap-3">
                                {listing.images.map((img) => (
                                    <div
                                        key={img.imageId}
                                        className="h-24 bg-slate-950 rounded-xl overflow-hidden border border-slate-800"
                                    >
                                        <img
                                            src={img.imageUrl}
                                            alt="Vehicle Angle"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
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
        </div>
    )
}