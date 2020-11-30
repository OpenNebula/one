import { useState, useMemo, useCallback } from 'react'
import PropTypes from 'prop-types'

import { debounce } from '@material-ui/core'
import Fuse from 'fuse.js'

function useSearch ({ list, listOptions }) {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState(undefined)

  const listFuse = useMemo(
    () => new Fuse(list, listOptions, Fuse.createIndex(listOptions?.keys, list)),
    [list, listOptions]
  )

  const debounceResult = useCallback(
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

  return { query, result, handleChange }
}

useSearch.propTypes = {
  list: PropTypes.arrayOf(PropTypes.object).isRequired,
  listOptions: PropTypes.shape({
    isCaseSensitive: PropTypes.bool,
    shouldSort: PropTypes.bool,
    sortFn: PropTypes.func,
    keys: PropTypes.arrayOf(PropTypes.string)
  })
}

useSearch.defaultProps = {
  list: [],
  listOptions: { keys: [] }
}

export default useSearch
