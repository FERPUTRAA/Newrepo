import SpotifyWebApi from 'spotify-web-api-node'

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
})

let accessToken: string | null = null
let tokenExpirationTime: number | null = null

async function getAccessToken() {
  if (accessToken && tokenExpirationTime && Date.now() < tokenExpirationTime) {
    return accessToken
  }

  const data = await spotifyApi.clientCredentialsGrant()
  accessToken = data.body['access_token']
  tokenExpirationTime = Date.now() + data.body['expires_in'] * 1000
  spotifyApi.setAccessToken(accessToken)
  return accessToken
}

export async function searchSong(query: string) {
  await getAccessToken()
  const result = await spotifyApi.searchTracks(query, { limit: 1 })
  if (result.body.tracks?.items.length) {
    const track = result.body.tracks.items[0]
    return {
      id: track.id,
      name: track.name,
      artist: track.artists[0].name,
      cover_url: track.album.images[0]?.url,
      preview_url: track.preview_url,
    }
  }
  return null
}

export async function getTrackDetails(trackId: string) {
  await getAccessToken()
  const result = await spotifyApi.getTrack(trackId)
  const track = result.body
  return {
    id: track.id,
    name: track.name,
    artist: track.artists[0].name,
    cover_url: track.album.images[0]?.url,
    preview_url: track.preview_url,
  }
}

