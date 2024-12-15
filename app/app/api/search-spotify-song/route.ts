import { NextResponse } from 'next/server'
import { searchSong } from '@/lib/spotify'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const song = searchParams.get('song')

  if (!song) {
    return NextResponse.json({ success: false, message: 'Song query is required' }, { status: 400 })
  }

  try {
    const track = await searchSong(song)

    if (!track) {
      return NextResponse.json({ success: false, message: 'Song not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: track })
  } catch (error) {
    console.error('Error searching song:', error)
    return NextResponse.json({ success: false, message: 'Failed to search song' }, { status: 500 })
  }
}

