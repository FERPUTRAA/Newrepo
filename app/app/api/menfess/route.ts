import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getTrackDetails } from '@/lib/spotify'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const sender = searchParams.get('sender')
  const recipient = searchParams.get('recipient')
  const date = searchParams.get('date')
  const sort = searchParams.get('sort') || 'desc'

  let query = supabase.from('menfess').select('*')

  if (id) {
    query = query.eq('id', id)
  } else {
    if (sender) {
      query = query.ilike('sender', `%${sender.toLowerCase()}%`)
    }
    if (recipient) {
      query = query.ilike('recipient', `%${recipient.toLowerCase()}%`)
    }
    if (date) {
      const formattedDate = `${date} 00:00:00`
      query = query.gte('created_at', formattedDate).lte('created_at', `${date} 23:59:59`)
    }
  }

  query = query.order('created_at', { ascending: sort === 'asc' })

  const { data: menfesses, error } = await query

  if (error) {
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
  }

  if (!menfesses || menfesses.length === 0) {
    return NextResponse.json({ success: false, message: 'Menfess tidak ditemukan' }, { status: 404 })
  }

  const menfessWithTracks = await Promise.all(
    menfesses.map(async (menfess) => {
      let trackDetails = null
      if (menfess.spotify_id) {
        try {
          trackDetails = await getTrackDetails(menfess.spotify_id)
        } catch (error) {
          console.error('Error fetching track details from Spotify:', error)
        }
      }

      return {
        ...menfess,
        track: trackDetails
          ? {
              title: trackDetails.name,
              artist: trackDetails.artist,
              cover_img: trackDetails.cover_url,
              preview_link: trackDetails.preview_url,
              spotify_embed_link: `https://open.spotify.com/embed/track/${menfess.spotify_id}`,
            }
          : null,
      }
    })
  )

  return NextResponse.json({ success: true, data: menfessWithTracks })
}

export async function POST(request: Request) {
  const { sender, message, spotify_id, recipient } = await request.json()

  if (!sender || !message || !recipient) {
    return NextResponse.json(
      { success: false, message: 'Sender, message, recipient is required' },
      { status: 400 }
    )
  }

  if (!spotify_id) {
    return NextResponse.json(
      { success: false, message: 'Spotify ID is required' },
      { status: 400 }
    )
  }

  const { data: newMenfess, error } = await supabase
    .from('menfess')
    .insert([{ sender, message, spotify_id, recipient }])
    .select()

  if (error) {
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
  }

  return NextResponse.json({ success: true, message: 'Success create menfess', data: newMenfess })
}

