import React from 'react';

export default function BrowseCard({ info }) {
  // Log the info object to check the id and other properties
  console.log('BrowseCard info:', info);

  const { icons, name, id } = info;
  
  // Warn if id is missing
  if (!id) {
    console.warn('No id found for this BrowseCard:', info);
  }
  
  // Use optional chaining in case icons is not populated
  const img_link = icons?.[0]?.url || 'default-image.jpg';

  return (
    <div className="browseLinkContainer">
      <a href={`/genre/${id}`} className="browseLink">
        <h3 style={titleStyle}>{name}</h3>
        <div style={overlayStyle}></div>
        <img loading="lazy" src={img_link} alt={name} style={{ width: '100%' }} />
      </a>
    </div>
  );
}

const titleStyle = {
  fontSize: '24px',
  padding: '16px',
  lineHeight: '1.3em',
  letterSpacing: '-.04em',
  overflowWrap: 'break-word',
  position: 'absolute',
  zIndex: '1',
  bottom: '0',
  textAlign: 'left',
  margin: 'auto',
  hyphens: 'auto'
};

const overlayStyle = {
  background: 'linear-gradient(0deg,rgba(0,0,0,0),rgba(0,0,0,.4))',
  position: 'absolute',
  top: '0',
  left: '0',
  width: '100%',
  height: '100%'    
};
