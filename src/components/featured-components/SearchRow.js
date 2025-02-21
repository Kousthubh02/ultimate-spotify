import React, { useEffect, useState } from 'react'
import makeAxiosRequest from '../../utilities/makeAxiosRequest'
import SearchRowTitle from './SearchRowTitle'
import SearchRowGrid from './SearchRowGrid'

export default function SearchRow({ title, type, query }) {
  const [result, setResult] = useState([])
  const [formattedQuery, setFormattedQuery] = useState('')

  useEffect(() => {
    const newFormattedQuery = query.toLowerCase().split(' ').join('+')
    setFormattedQuery(newFormattedQuery)
  }, [query])

  useEffect(() => {
    if (formattedQuery.length > 0) {
      const [source, makeRequest] = makeAxiosRequest(
        `https://api.spotify.com/v1/search?q=${formattedQuery}&type=${type}&limit=9`
      )
      makeRequest()
        .then((data) => {
          const key = Object.keys(data)[0]
          const items = data[key].items
          // Filter out any null (or undefined) items from the result
          const safeItems = Array.isArray(items)
            ? items.filter((item) => item != null)
            : []
          setResult(safeItems)
        })
        .catch((error) => {
          console.log(error)
        })
      return () => source.cancel()
    }
  }, [formattedQuery, type])

  return (
    <div
      className="CollectionRow"
      style={{ display: result.length === 0 ? 'none' : 'grid' }}
    >
      <SearchRowTitle title={title} />
      <SearchRowGrid type={type} info={result} />
    </div>
  )
}
