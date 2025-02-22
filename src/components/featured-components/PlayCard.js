import React, { useContext, useCallback } from 'react';
import { useHistory, Link } from 'react-router-dom';
import axios from 'axios';
import PropTypes from 'prop-types';

import CardInfo from './CardInfo';
import CardDisplay from './CardDisplay';
import Icon from '../icons';
import putWithToken from '../../utilities/putWithToken';
import { TokenContext, LoginContext, PlayContext, MessageContext } from '../../utilities/context';

const PlayCard = React.forwardRef(({ info, type }, ref) => {
  const history = useHistory();
  const setMessage = useContext(MessageContext);
  const token = useContext(TokenContext);
  const loggedIn = useContext(LoginContext);
  const updatePlayer = useContext(PlayContext);

  // Handle genre-specific data structure
  const isGenre = type === 'genre';
  const description = returnDescription(type, info);
  const { name, id, uri } = info;

  // Get correct images array based on type
  const images = isGenre ? info.icons : 
                type === 'track' ? info.album?.images : 
                info.images;
  const image_url = images?.[0]?.url || null;

  // Modified play context handler for genres
  const playContext = useCallback(() => {
    if (!uri && !isGenre) {
      history.push('/tracks');
      return;
    }

    const body = isGenre ? { context_uri: `spotify:genre:${id}` } :
                 type === 'track' ? { uris: [uri] } : 
                 { context_uri: uri };

    const source = axios.CancelToken.source();

    putWithToken(`https://api.spotify.com/v1/me/player/play`, token, source, body)()
      .then(response => {
        if (response.status === 204) {
          setTimeout(() => updatePlayer(), 1000);
        }
      })
      .catch(error => setMessage(`ERROR: ${error.message || error}`));
  }, [history, token, type, uri, id, isGenre, setMessage, updatePlayer]);

  // Generate correct link path
  const getLinkPath = () => {
    if (info.to) return info.to;
    if (isGenre) return `/genre/${id}`;
    if (type === 'track') return `/album/${info.album?.id}?highlight=${id}`;
    return `/${type}/${id}`;
  };

  return (
    <div className="pcWrapper">
      <Link
        to={getLinkPath()}
        style={{ textDecoration: 'none', color: 'var(--main-text)', zIndex: '3' }}
      >
        <div ref={ref} className="PlayCard">
          <CardDisplay 
            url={image_url} 
            type={isGenre ? 'genre' : type} 
            fallbackIcon={isGenre ? 'Music' : 'Playlist'}
          />
          <CardInfo 
            title={name} 
            description={description}
            extra={isGenre ? `${info.playlists?.total || 0} playlists` : null}
          />
        </div>
      </Link>
      {loggedIn ? (
        <button
          className="smallButton no-outline"
          title="Play"
          onClick={playContext}
        >
          <Icon name="Play" height="17" width="17" />
        </button>
      ) : (
        <button
          className="smallButton no-outline"
          title="Play"
          data-tip="play"
          data-for="tooltipMain"
          data-event="click"
        >
          <Icon name="Play" height="17" width="17" />
        </button>
      )}
    </div>
  );
});

function returnDescription(type, info) {
  switch (type) {
    case 'playlist':
      return info.description || `By ${info.owner?.display_name || 'unknown'}`;
    case 'album':
      return info.artists?.map(a => a.name).join(', ') || 'Various artists';
    case 'artist':
      return 'Artist';
    case 'track':
      return info.artists?.map(a => a.name).join(', ') || 'Various artists';
    case 'genre':
      return info.description || 'Music genre';
    default:
      return null;
  }
}

PlayCard.propTypes = {
  info: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    uri: PropTypes.string,
    type: PropTypes.oneOf(['genre', 'playlist', 'album', 'artist', 'track']),
    images: PropTypes.array,
    icons: PropTypes.array,
    album: PropTypes.object,
    artists: PropTypes.array,
    owner: PropTypes.object,
    playlists: PropTypes.object,
    description: PropTypes.string
  }).isRequired,
  type: PropTypes.oneOf(['genre', 'playlist', 'album', 'artist', 'track']).isRequired
};

export default PlayCard;