import React from 'react';
import { Link } from 'react-router-dom'; // Add this import
import PropTypes from 'prop-types'; // For prop type validation

export default function BrowseCard({ info }) {
  const { icons, name, id } = info;
  
  // Validate required props
  if (!id) {
    console.error('Missing id in BrowseCard:', info);
    return null; // Don't render invalid card
  }

  const img_link = icons?.[0]?.url || 'default-image.jpg';

  return (
    <div className="browseLinkContainer">
      {/* Use Link instead of anchor tag for SPA navigation */}
      <Link to={`/genre/${id}`} className="browseLink">
        <h3 style={titleStyle}>{name}</h3>
        <div style={overlayStyle}></div>
        <img 
          loading="lazy" 
          src={img_link} 
          alt={name} 
          style={{ width: '100%' }} 
        />
      </Link>
    </div>
  );
}

// Add prop type validation
BrowseCard.propTypes = {
  info: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    icons: PropTypes.arrayOf(
      PropTypes.shape({
        url: PropTypes.string
      })
    )
  }).isRequired
};

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
