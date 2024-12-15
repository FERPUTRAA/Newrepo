import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'
import { getTrackDetails } from '@/lib/spotify'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (req.method === 'GET') {
    const { data: menfess, error } = await supabase
      .from('menfess')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return res.status(500).json({ success: false, message: 'Internal Server Error' })
    }

    if (!menfess) {
      return res.status(404).json({ success: false, message: 'Menfess tidak ditemukan' })
    }

    let trackDetails = null
    if (menfess.spotify_id) {
      try {
        trackDetails = await getTrackDetails(menfess.spotify_id)
      } catch (error) {
        console.error('Error fetching track details from Spotify:', error)
      }
    }

    const menfessWithTrack = {
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

    return res.status(200).json({ success: true, data: menfessWithTrack })
  } else if (req.method === 'PUT') {
    const { sender, message, spotify_id, recipient } = req.body

    const { data: updateMenfess, error } = await supabase
      .from('menfess')
      .update({ sender, message, spotify_id, recipient, updated_at: new Date() })
      .eq('id', id)
      .select()

    if (error) {
      return res.status(500).json({ success: false, message: 'Internal Server Error' })
    }

    return res.status(200).json({ success: true, message: 'Success update menfess', data: updateMenfess })
  } else if (req.method === 'DELETE') {
    const { data, error } = await supabase.from('menfess').delete().eq('id', id)

    if (error) {
      return res.status(500).json({ success: false, message: 'Internal Server Error' })
    }

    if (data.length === 0) {
      return res.status(404).json({ success: false, message: 'Menfess tidak ditemukan' })
    }

    return res.status(200).json({ success: true, message: 'Success delete menfess' })
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}

