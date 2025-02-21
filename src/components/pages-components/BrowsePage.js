import React, { useState, useEffect } from 'react';
import makeAxiosRequest from '../../utilities/makeAxiosRequest';
import BrowseCard from '../featured-components/BrowseCard';
import PageTitle from '../featured-components/PageTitle';

export default function BrowsePage() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    // Flag to track mounting
    let isMounted = true;

    const [source, makeRequest] = makeAxiosRequest(
      'https://api.spotify.com/v1/browse/categories?limit=50'
    );

    makeRequest()
      .then((data) => {
        // Check if the component is still mounted before updating state
        if (isMounted && data.categories && data.categories.items) {
          setCategories(data.categories.items);
        }
      })
      .catch((error) => console.error('Error fetching categories:', error));

    // Cleanup function cancels the Axios request and prevents state updates
    return () => {
      isMounted = false;
      source.cancel(); // Cancel the Axios request if it's still pending
    };
  }, []);

  return (
    <div className="page-content">
      <div className="browsePage">
        <PageTitle name="Browse All" />
        <div className="browseGrid">
          {categories.length > 0 ? (
            categories.map((category) => (
              <BrowseCard key={category.id} info={category} />
            ))
          ) : (
            <p>Loading...</p>
          )}
        </div>
      </div>
    </div>
  );
}
