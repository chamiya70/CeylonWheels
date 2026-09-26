import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// DELETE: Delete a specific listing photo by imageId
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const imageId = searchParams.get('imageId')

    if (!imageId) {
      return NextResponse.json({ error: 'Missing imageId' }, { status: 400 })
    }

    await db.listingImage.delete({
      where: { imageId },
    })

    return NextResponse.json({ message: 'Image deleted successfully' }, { status: 200 })
  } catch (error) {
    console.error('Error deleting image:', error)
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 })
  }
}
