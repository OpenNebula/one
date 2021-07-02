import * as React from 'react'
import PropTypes from 'prop-types'

import { TextField, Box } from '@material-ui/core'
import { useSearch } from 'client/hooks'
import { ListInfiniteScroll } from 'client/components/List'

const Search = ({
  list,
  listOptions,
  renderResult,
  startAdornment,
  searchBoxProps
}) => {
  const { result, query, handleChange } = useSearch({ list, listOptions })

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
  list: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.object,
      PropTypes.string
    ])
  ).isRequired,
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
