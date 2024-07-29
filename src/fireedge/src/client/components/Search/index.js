/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
 *                                                                           *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may   *
 * not use this file except in compliance with the License. You may obtain   *
 * a copy of the License at                                                  *
 *                                                                           *
 * http://www.apache.org/licenses/LICENSE-2.0                                *
 *                                                                           *
 * Unless required by applicable law or agreed to in writing, software       *
 * distributed under the License is distributed on an "AS IS" BASIS,         *
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  *
 * See the License for the specific language governing permissions and       *
 * limitations under the License.                                            *
 * ------------------------------------------------------------------------- */
/* eslint-disable jsdoc/require-jsdoc */
import PropTypes from 'prop-types'
import { TextField, Box } from '@mui/material'

import { useSearch } from 'client/hooks'
import { ListInfiniteScroll } from 'client/components/List'

import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'

const Search = ({
  list,
  listOptions,
  renderResult,
  startAdornment,
  searchBoxProps,
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
          placeholder={`${Tr(T.Search)}...`}
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
    PropTypes.oneOfType([PropTypes.object, PropTypes.string])
  ).isRequired,
  listOptions: PropTypes.shape({
    isCaseSensitive: PropTypes.bool,
    shouldSort: PropTypes.bool,
    sortFn: PropTypes.func,
    keys: PropTypes.arrayOf(PropTypes.string),
  }),
  renderResult: PropTypes.func,
  startAdornment: PropTypes.objectOf(PropTypes.any),
  searchBoxProps: PropTypes.objectOf(PropTypes.any),
}

Search.defaultProps = {
  list: [],
  listOptions: { keys: [] },
  renderResult: (item) => item,
  startAdornment: undefined,
  searchBoxProps: undefined,
}

export default Search
