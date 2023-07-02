/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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
import { ReactElement, useState, useCallback } from 'react'
import PropTypes from 'prop-types'

import clsx from 'clsx'
import { alpha, debounce, InputBase } from '@mui/material'
import makeStyles from '@mui/styles/makeStyles'
import { Search as SearchIcon } from 'iconoir-react'
import {
  UseGlobalFiltersInstanceProps,
  UseGlobalFiltersState,
} from 'react-table'

import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'

const useStyles = makeStyles(({ spacing, palette, shape, breakpoints }) => ({
  search: {
    position: 'relative',
    borderRadius: shape.borderRadius,
    backgroundColor: alpha(palette.divider, 0.15),
    '&:hover': {
      backgroundColor: alpha(palette.divider, 0.25),
    },
    width: '100%',
    [breakpoints.up('sm')]: {
      width: 'auto',
    },
  },
  searchIcon: {
    padding: spacing(0, 2),
    height: '100%',
    position: 'absolute',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputRoot: {
    color: 'inherit',
    width: '100%',
  },
  inputInput: {
    padding: spacing(1, 1, 1, 0),
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${spacing(4)})`,
  },
}))

/**
 * Render search input.
 *
 * @param {object} props - Props
 * @param {string} [props.className] - Class name for the container
 * @param {object} props.searchProps - Props for search input
 * @param {UseGlobalFiltersInstanceProps} props.useTableProps - Table props
 * @returns {ReactElement} Component JSX
 */
const GlobalSearch = ({ className, useTableProps, searchProps }) => {
  const classes = useStyles()

  const { setGlobalFilter, state } = useTableProps

  /** @type {UseGlobalFiltersState} */
  const { globalFilter } = state

  const [value, setValue] = useState(() => globalFilter)

  const handleChange = useCallback(
    // Set undefined to remove the filter entirely
    debounce((newFilter) => setGlobalFilter(newFilter || undefined), 200),
    [setGlobalFilter]
  )

  return (
    <div className={clsx(classes.search, className)}>
      <div className={classes.searchIcon}>
        <SearchIcon />
      </div>
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
    </div>
  )
}

GlobalSearch.propTypes = {
  className: PropTypes.string,
  useTableProps: PropTypes.object.isRequired,
  searchProps: PropTypes.object,
}

export default GlobalSearch
