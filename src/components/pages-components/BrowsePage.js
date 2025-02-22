import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BrowseCard from '../featured-components/BrowseCard';
import PageTitle from '../featured-components/PageTitle';

export default function BrowsePage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    logEnv();
    const source = axios.CancelToken.source();
    
    async function fetchData() {
      try {
        const token = await getAccessToken();

        // 1. Fetch all categories for Indian market
        const categoriesResponse = await axios.get(
          'https://api.spotify.com/v1/browse/categories?country=IN&limit=50',
          {
            headers: { Authorization: `Bearer ${token}` },
            cancelToken: source.token,
          }
        );

        const allCategories = categoriesResponse.data.categories.items;

        // 2. Verify each category has playlists with tracks
        const verifiedCategories = await Promise.all(
          allCategories.map(async (category) => {
            try {
              const searchResponse = await axios.get(
                `https://api.spotify.com/v1/search?q=${encodeURIComponent(category.name)}&type=playlist&market=IN&limit=1`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                  cancelToken: source.token,
                }
              );

              const playlist = searchResponse.data.playlists.items[0];
              if (!playlist) return null;

              const tracksResponse = await axios.get(
                `https://api.spotify.com/v1/playlists/${playlist.id}/tracks?market=IN`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                  cancelToken: source.token,
                }
              );

              return tracksResponse.data.items.length > 0 ? category : null;
            } catch (error) {
              console.warn(`Skipping ${category.name}:`, error.message);
              return null;
            }
          })
        );

        setCategories(verifiedCategories.filter(Boolean));
        setLoading(false);

      } catch (err) {
        setError(err);
        setLoading(false);
      }
    }

    fetchData();
    return () => source.cancel();
  }, []);

  return (
    <div className="page-content">
      <div className="browsePage">
        <PageTitle name="Browse All Categories" />
        {error && <div className="error">{error.message}</div>}
        {loading ? (
          <p>Loading categories...</p>
        ) : (
          <div className="browseGrid">
            {categories.map((category) => (
              <BrowseCard 
                key={category.id} 
                info={category}
                extraText="Tracks Available"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
async function getAccessToken() {
  const tokenUrl = 'https://accounts.spotify.com/api/token';
  
  // Ensure environment variables are properly loaded
  const clientId = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.REACT_APP_SPOTIFY_CLIENT_SECRET;

  // Verify credentials exist
  if (!clientId || !clientSecret) {
    throw new Error('Missing Spotify client credentials');
  }

  try {
    const response = await axios.post(
      tokenUrl,
      new URLSearchParams({ grant_type: 'client_credentials' }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        },
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error('Authentication failed:', error.response?.data);
    throw error;
  }
}


export function logEnv() {
  if (process.env.NODE_ENV === 'development') {
    console.log('Environment Variables:');
    console.log('REACT_APP_SPOTIFY_CLIENT_ID:', process.env.REACT_APP_SPOTIFY_CLIENT_ID ? '*****' : 'Not Found');
    console.log('REACT_APP_SPOTIFY_CLIENT_SECRET:', process.env.REACT_APP_SPOTIFY_CLIENT_SECRET ? '*****' : 'Not Found');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('Public URL:', process.env.PUBLIC_URL);
  }
}