import React, { useState, useEffect, useContext } from 'react';
import CollectionRow from '../featured-components/CollectionRow';
import makeAxiosRequest from '../../utilities/makeAxiosRequest';
import getLocale from '../../utilities/locale';
import { MessageContext } from '../../utilities/context';

export default function HomePage() {
  const setMessage = useContext(MessageContext);
  const [collections, setCollections] = useState([]);
  const [playlistsMap, setPlaylistsMap] = useState({});

  useEffect(() => {
    const [language, locale] = getLocale();
    const [source, makeRequest] = makeAxiosRequest(`https://api.spotify.com/v1/browse/categories?limit=6&country=${locale}&locale=${language}_${locale}`);
    
    makeRequest()
      .then((data) => {
        if (!data || !data.categories) {
          console.error('Categories API returned invalid data:', data);
          setMessage('ERROR: Failed to load categories');
          setCollections([]);
          return;
        }
        setCollections(data.categories.items || []);
      })
      .catch((error) => {
        console.error('Categories API error:', error);
        setMessage(`ERROR: ${error.message || error}`);
      });

    return () => source.cancel();
  }, [setMessage]);

  useEffect(() => {
    if (collections.length === 0) return;

    const fetchPlaylists = async () => {
      try {
        const requests = collections.map((collection) => {
          const { id } = collection;
          const [, makeRequest] = makeAxiosRequest(`https://api.spotify.com/v1/browse/categories/${id}/playlists?limit=9`);
          return makeRequest();
        });

        const responses = await Promise.all(requests);
        const newPlaylistsMap = responses.reduce((acc, data, index) => {
          const { name, id } = collections[index];
          if (!data || !data.playlists) {
            console.warn(`Playlists API for ${name} returned invalid data:`, data);
            acc[name] = { id, playlists: [] };
          } else {
            const playlists = data.playlists.items || [];
            acc[name] = { id, playlists };
          }
          return acc;
        }, {});

        setPlaylistsMap(newPlaylistsMap);
      } catch (error) {
        console.error('Playlists API error:', error);
        setMessage(`ERROR: ${error.message || error}`);
      }
    };

    fetchPlaylists();
  }, [collections, setMessage]);

  return (
    <div className="page-content">
      <div className="pageContent">
        <CollectionRow
          name="Uniquely for you"
          id={null}
          playlists={[
            {
              id: '',
              to: '/tracks',
              description: '',
              name: 'Liked Songs',
              images: [{ url: 'https://misc.scdn.co/liked-songs/liked-songs-300.png' }],
            },
          ]}
        />
        {Object.entries(playlistsMap).map(([name, info]) => {
          const { id, playlists } = info;
          return <CollectionRow name={name} key={id} id={id} playlists={playlists} />;
        })}
      </div>
    </div>
  );
}