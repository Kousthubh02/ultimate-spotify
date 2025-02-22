import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import PlayCard from '../featured-components/PlayCard';

export default function GenrePage() {
  const { id } = useParams();
  const [tracks, setTracks] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const source = axios.CancelToken.source();

    async function fetchTracks() {
      try {
        const token = await getAccessToken();

        // 1. Get genre details
        const genreResponse = await axios.get(
          `https://api.spotify.com/v1/browse/categories/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            cancelToken: source.token,
          }
        );

        // 2. Search for genre playlists
        const searchResponse = await axios.get(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(genreResponse.data.name)}&type=playlist&limit=1`,
          {
            headers: { Authorization: `Bearer ${token}` },
            cancelToken: source.token,
          }
        );

        // Validate playlist exists
        const playlist = searchResponse.data?.playlists?.items?.[0];
        if (!playlist) {
          throw new Error('No playlists found for this genre');
        }

        // 3. Get playlist tracks
        const tracksResponse = await axios.get(
          `https://api.spotify.com/v1/playlists/${playlist.id}/tracks`,
          {
            headers: { Authorization: `Bearer ${token}` },
            cancelToken: source.token,
          }
        );

        // Filter out null tracks and set state
        const validTracks = tracksResponse.data.items
          .filter(item => item.track)
          .map(item => item.track);

        setTracks(validTracks);

      } catch (err) {
        if (!axios.isCancel(err)) {
          setError(err.response?.data?.error?.message || err.message);
        }
      }
    }

    if (id) fetchTracks();

    return () => source.cancel();
  }, [id]);

  if (error) return <div className="error-message">Error: {error}</div>;

  return (
    <div className="page-content">
      <h1>Tracks</h1>
      <div className="track-grid">
        {tracks.map(track => (
          <PlayCard
            key={track.id}
            info={track}
            type="track"
          />
        ))}
      </div>
    </div>
  );
}



// Reuse your existing getAccessToken function
async function getAccessToken() {
  const clientId = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.REACT_APP_SPOTIFY_CLIENT_SECRET;
  const tokenUrl = 'https://accounts.spotify.com/api/token';
  
  try {
    const response = await axios.post(
      tokenUrl,
      'grant_type=client_credentials',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        },
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error('Error fetching access token:', error);
    throw error;
  }
}