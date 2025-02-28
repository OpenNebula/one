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
import {
  alpha,
  debounce,
  FormControl,
  InputBase,
  useTheme,
} from '@mui/material'
import { ReactElement, useCallback, useMemo } from 'react'

import clsx from 'clsx'
import { Search as SearchIcon } from 'iconoir-react'
import { UseGlobalFiltersInstanceProps } from 'opennebula-react-table'
import PropTypes from 'prop-types'

import { T } from '@ConstantsModule'
import { Tr } from '@modules/components/HOC'

const useStyles = ({ spacing, palette, shape, breakpoints }) => ({
  search: css({
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
  }),
  searchIcon: css({
    padding: spacing(0, 2),
    height: '100%',
    position: 'absolute',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }),
  inputRoot: css({
    color: 'inherit',
    width: '100%',
  }),
  inputInput: css({
    padding: spacing(1, 1, 1, 0),
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${spacing(4)})`,
  }),
})

/**
 * Render search input.
 *
 * @param {object} props - Props
 * @param {string} [props.className] - Class name for the container
 * @param {object} props.searchProps - Props for search input
 * @param {UseGlobalFiltersInstanceProps} props.useTableProps - Table props
 * @param {string} props.value - Filter value
 * @param {Function} props.setValue - Set filter value
 * @returns {ReactElement} Component JSX
 */
const GlobalSearch = ({
  className,
  useTableProps,
  searchProps,
  value,
  setValue,
}) => {
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
    <div className={clsx(classes.search, className)}>
      <div className={classes.searchIcon}>
        <SearchIcon />
      </div>
      <FormControl>
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
