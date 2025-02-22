import React, { useState, useCallback } from 'react';
import { Route } from 'react-router-dom';

import Headerbar from './Headerbar';
import PageContent from './PageContent';
import HistoryNav from './HistoryNav';
import UserPrompt from './UserPrompt';
import SearchBar from './SearchBar';
import UserInfo from './UserInfo';
import CollectionNav from './CollectionNav';

function Featured(props) {
  console.log('Rendering Featured with props:', props);
  const loggedIn = props.loggedIn;
  const [query, setQuery] = useState('');

  console.log('Featured state query:', query);

  // Use useCallback to memoize the resetQuery function
  const resetQuery = useCallback(() => {
    console.log('resetQuery called.');
    setQuery('');
  }, []);

  return (
    <div className="featured">
      <Headerbar>

        <Route exact path="/search">
          <SearchBar query={query} setQuery={setQuery} resetQuery={resetQuery} />
        </Route>

        <Route path="/collection">
          <CollectionNav />
        </Route>

        {loggedIn ? <UserInfo /> : <UserPrompt />}
      </Headerbar>

      <PageContent query={query} {...props} />
    </div>
  );
}

export default Featured;