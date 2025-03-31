/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import { css } from '@emotion/css'
import { debounce, FormControl, InputBase, useTheme } from '@mui/material'
import { ReactElement, useCallback, useMemo } from 'react'

import { Search as SearchIcon } from 'iconoir-react'
import { UseGlobalFiltersInstanceProps } from 'opennebula-react-table'
import PropTypes from 'prop-types'

import { T } from '@ConstantsModule'
import { Tr } from '@modules/components/HOC'

const useStyles = ({ palette, breakpoints }) => ({
  search: css({
    gridArea: 'search',
    position: 'relative',
    borderRadius: '6.25rem',
    display: 'flex',
    alignItems: 'center',
    ...palette.searchBar.normal,
    borderWidth: '0.0625rem',
    borderStyle: 'solid',
    '&:hover': {
      ...palette.searchBar.hover,
      borderWidth: '0.0625rem',
      borderStyle: 'solid',
    },
    '&:focus-within': {
      ...palette.searchBar.focus,
      borderWidth: '0.125rem',
      borderStyle: 'solid',
    },
    padding: '1rem 1rem 1rem 1.5rem',
    width: '100%',
    marginRight: '1rem',
  }),
  searchIcon: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: palette.searchBar.icon.color,
  }),
  inputRoot: css({
    flex: 1,
    margin: 0,
  }),
  inputInput: css({
    padding: 0,
    lineHeight: '1.25rem',
    fontWeight: 500,
    '&::-webkit-search-cancel-button': {
      cursor: 'pointer',
    },
    '&::-ms-clear': {
      cursor: 'pointer',
    },
    '&::after': {
      cursor: 'pointer',
    },
  }),
})

/**
 * Render search input.
 *
 * @param {object} props - Props
 * @param {object} props.searchProps - Props for search input
 * @param {UseGlobalFiltersInstanceProps} props.useTableProps - Table props
 * @param {string} props.value - Filter value
 * @param {Function} props.setValue - Set filter value
 * @returns {ReactElement} Component JSX
 */
const GlobalSearch = ({ useTableProps, searchProps, value, setValue }) => {
  const theme = useTheme()
  const classes = useMemo(() => useStyles(theme), [theme])
  const { setGlobalFilter } = useTableProps

  const handleChange = useCallback(
    debounce((newFilter) => {
      setValue(newFilter)
      setGlobalFilter(newFilter || undefined)
    }, 200),
    [setValue, setGlobalFilter]
  )

  return (
    <div className={classes.search}>
      <div className={classes.searchIcon}>
        <SearchIcon />
      </div>
      <FormControl className={classes.inputRoot}>
        <InputBase
          value={value ?? ''}
          type="search"
          onChange={(event) => {
            setValue(event.target.value)
            handleChange(event.target.value)
          }}
          placeholder={`${Tr(T.Search)}...`}
          classes={{ root: classes.inputRoot, input: classes.inputInput }}
          inputProps={{ 'aria-label': 'search', ...(searchProps ?? {}) }}
        />
      </FormControl>
    </div>
  )
}

GlobalSearch.propTypes = {
  className: PropTypes.string,
  useTableProps: PropTypes.object.isRequired,
  searchProps: PropTypes.object,
  value: PropTypes.string,
  setValue: PropTypes.func,
}

export default GlobalSearch
