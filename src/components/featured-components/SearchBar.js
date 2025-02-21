import React, { useEffect } from 'react'
import Icon from '../icons'

export default function SearchBar({ query, setQuery, resetQuery }) {
  console.log('Rendering SearchBar with query:', query)

  useEffect(() => {
    console.log('SearchBar mounted.')
    return () => {
      console.log('SearchBar unmounted. Calling resetQuery.')
      resetQuery()
    }
    // eslint-disable-next-line
  }, [])

  return (
    <div className="SearchContainer">
      <div className="SearchBar">
        <div style={iconStyle}>
          <Icon name="N-Search" />
        </div>
        <input
          className="SearchInput no-outline"
          maxLength="80"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          autoFocus={true}
          placeholder="Search for Artists, Songs, or Podcasts"
          value={query}
          onChange={(e) => {
            console.log('Input changed to:', e.target.value)
            setQuery(e.target.value)
          }}
        />
      </div>
    </div>
  )
}

const iconStyle = {
  position: 'absolute',
  top: '0',
  bottom: '0',
  left: '12px',
  display: 'flex',
  alignItems: 'center',
  cursor: 'text',
}
