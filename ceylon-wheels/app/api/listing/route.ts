import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET: Fetch all car listings with optional filters (e.g., make, model, type)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const make = searchParams.get('make')
    const model = searchParams.get('model')
    const type = searchParams.get('type')

    const listings = await db.listing.findMany({
      where: {
        AND: [
          make ? { make: { equals: make, mode: 'insensitive' } } : {},
          model ? { model: { equals: model, mode: 'insensitive' } } : {},
          type ? { type: { equals: type, mode: 'insensitive' } } : {},
        ],
      },
      include: {
        images: true,
        seller: {
          include: {
            user: {
              select: {
                email: true,
                phone: true,
              }
            }
          }
        },
      },
      orderBy: {
        listingId: 'desc',
      },
    })

    return NextResponse.json(listings, { status: 200 })
  } catch (error) {
    console.error('Error fetching listings:', error)
    return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 })
  }
}

// POST: Create a new car listing
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { sellerId, title, price, make, model, year, type, lat, lng, videoUrl, images } = body

    // Basic validation
    if (!sellerId || !title || !price || !make || !model || !year || !type || lat === undefined || lng === undefined) {
      return NextResponse.json({ error: 'Missing required listing fields' }, { status: 400 })
    }

    const newListing = await db.listing.create({
      data: {
        sellerId,
        title,
        price: parseFloat(price),
        make,
        model,
        year: parseInt(year),
        type,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        videoUrl,
        images: images && images.length > 0 ? {
          create: images.map((url: string) => ({ imageUrl: url }))
        } : undefined,
      },
      include: {
        images: true,
      }
    })

    return NextResponse.json(
      { message: 'Listing created successfully', listing: newListing },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating listing:', error)
    return NextResponse.json({ error: 'Failed to create listing' }, { status: 500 })
  }
}

// PUT: Update an existing car listing (including adding/updating photos)
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { listingId, title, price, make, model, year, type, lat, lng, videoUrl, status, images } = body

    if (!listingId) {
      return NextResponse.json({ error: 'Missing listingId' }, { status: 400 })
    }

    // If new images were passed, add them to the listingImage table
    if (images && Array.isArray(images) && images.length > 0) {
      await db.listingImage.createMany({
        data: images.map((url: string) => ({
          listingId,
          imageUrl: url,
        })),
      })
    }

    const updatedListing = await db.listing.update({
      where: { listingId },
      data: {
        ...(title !== undefined && { title }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(make !== undefined && { make }),
        ...(model !== undefined && { model }),
        ...(year !== undefined && { year: parseInt(year) }),
        ...(type !== undefined && { type }),
        ...(lat !== undefined && { lat: parseFloat(lat) }),
        ...(lng !== undefined && { lng: parseFloat(lng) }),
        ...(videoUrl !== undefined && { videoUrl }),
        ...(status !== undefined && { status }),
      },
      include: {
        images: true,
      }
    })

    return NextResponse.json(
      { message: 'Listing updated successfully', listing: updatedListing },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error updating listing:', error)
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Failed to update listing' }, { status: 500 })
  }
}

// DELETE: Delete a car listing
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const idFromQuery = searchParams.get('id') || searchParams.get('listingId')

    let listingId = idFromQuery
    if (!listingId) {
      try {
        const body = await request.json()
        listingId = body?.listingId
      } catch {
        // body might be empty if query parameter is used
      }
    }

    if (!listingId) {
      return NextResponse.json(
        { error: 'Missing listingId (provide via query parameter ?id=... or JSON body { listingId })' },
        { status: 400 }
      )
    }

    const deletedListing = await db.listing.delete({
      where: { listingId },
    })

    return NextResponse.json(
      { message: 'Listing deleted successfully', listing: deletedListing },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error deleting listing:', error)
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Failed to delete listing' }, { status: 500 })
  }
}