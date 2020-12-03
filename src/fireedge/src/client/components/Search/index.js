import React, { useState, useMemo } from 'react'
import PropTypes from 'prop-types'

import Fuse from 'fuse.js'
import { TextField, Box, debounce } from '@material-ui/core'

import { ListInfiniteScroll } from 'client/components/List'

const Search = ({
  list,
  listOptions,
  renderResult,
  startAdornment,
  searchBoxProps
}) => {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState(undefined)
  const listFuse = useMemo(
    () => new Fuse(list, listOptions, Fuse.createIndex(listOptions?.keys, list)),
    [list, listOptions]
  )

  const debounceResult = React.useCallback(
    debounce(value => {
      const search = listFuse.search(value)?.map(({ item }) => item)

      setResult(value ? search : undefined)
    }, 1000),
    [list]
  )

  const handleChange = event => {
    const { value: nextValue } = event?.target

    setQuery(nextValue)
    debounceResult(nextValue)
  }

  return (
    <>
      <Box {...searchBoxProps}>
        {startAdornment && startAdornment}
        <TextField
          type="search"
          value={query}
          onChange={handleChange}
          fullWidth
          placeholder="Search..."
        />
      </Box>
      {result?.length === 0 ? (
        <h4>{'Your search did not match'}</h4>
      ) : (
        <ListInfiniteScroll list={result ?? list} renderResult={renderResult} />
      )}
    </>
  )
}

Search.propTypes = {
  list: PropTypes.arrayOf(PropTypes.object).isRequired,
  listOptions: PropTypes.shape({
    isCaseSensitive: PropTypes.bool,
    shouldSort: PropTypes.bool,
    sortFn: PropTypes.func,
    keys: PropTypes.arrayOf(PropTypes.string)
  }),
  renderResult: PropTypes.func,
  startAdornment: PropTypes.objectOf(PropTypes.any),
  searchBoxProps: PropTypes.objectOf(PropTypes.any)
}

Search.defaultProps = {
  list: [],
  listOptions: { keys: [] },
  renderResult: item => item,
  startAdornment: undefined,
  searchBoxProps: undefined
}

export default Search
