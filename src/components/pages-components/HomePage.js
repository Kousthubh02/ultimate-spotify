import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import PlayCard from '../featured-components/PlayCard';
import PageTitle from '../featured-components/PageTitle';
import { MessageContext, TokenContext } from '../../utilities/context';

export default function HomePage() {
  const setMessage = useContext(MessageContext);
  const token = useContext(TokenContext);
  const [tracks, setTracks] = useState([]);

  useEffect(() => {
    if (!token) return;

    // Pick a random letter from the alphabet to use as a search query
    const letters = "abcdefghijklmnopqrstuvwxyz";
    const randomLetter = letters[Math.floor(Math.random() * letters.length)];
    const endpoint = `https://api.spotify.com/v1/search?q=${randomLetter}&type=track&limit=15`;

    const fetchTracks = async () => {
      try {
        const response = await axios.get(endpoint, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (
          response.data &&
          response.data.tracks &&
          response.data.tracks.items
        ) {
          setTracks(response.data.tracks.items);
        } else {
          setMessage("ERROR: Failed to load tracks");
        }
      } catch (error) {
        console.error("Search API error:", error);
        setMessage(`ERROR: ${error.message || error}`);
      }
    };

    fetchTracks();
  }, [token, setMessage]);

  return (
    <div className="page-content">
      <PageTitle name="Random Tracks" />
      <div className="browseGrid">
        {tracks.length > 0 ? (
          tracks.map(track => (
            <PlayCard key={track.id} info={track} type="track" />
          ))
        ) : (
          <p>Please Login to view tracks</p>
        )}
      </div>
    </div>
  );
}
