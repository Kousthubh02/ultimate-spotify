import React from 'react';
import PlayCard from './PlayCard';

const RowGrid = React.forwardRef(({ info }, ref) => {
  // Ensure info is an array; if not, default to an empty array.
  const safeInfo = Array.isArray(info) ? info : [];
  console.log('RowGrid: Received info:', safeInfo);

  return (
    <div className="RowGrid">
      {safeInfo.map((playlist, index) => {
        // Extra defensive check: if playlist is falsy, log and skip rendering it.
        if (!playlist) {
          console.warn(`RowGrid: Encountered a null or undefined playlist at index ${index}`);
          return null;
        }

        // Destructure the properties; if type is missing, assign a default.
        const { id, name, type } = playlist;
        const safeType = type || 'default';

        // Create a fallback key if id is missing or empty.
        const key = id && id.trim() !== '' ? id : `${name || 'playlist'}-${index}`;
        if (!id || id.trim() === '') {
          console.warn(`RowGrid: Playlist at index ${index} is missing an id; using fallback key: ${key}`, playlist);
        }

        console.log(`RowGrid: Rendering playlist at index ${index} with key: ${key}`, playlist);

        // Attach the forwarded ref only to the last item.
        if (index === safeInfo.length - 1) {
          return (
            <PlayCard
              ref={ref}
              key={key}
              info={playlist}
              type={safeType}
            />
          );
        } else {
          return (
            <PlayCard
              key={key}
              info={playlist}
              type={safeType}
            />
          );
        }
      })}
    </div>
  );
});

export default RowGrid;
