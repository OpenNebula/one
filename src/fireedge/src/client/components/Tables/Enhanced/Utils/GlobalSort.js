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
import { ReactElement, useEffect, useMemo, memo } from 'react'
import PropTypes from 'prop-types'

import { SortDown, ArrowDown, ArrowUp } from 'iconoir-react'
import { MenuItem, MenuList, Stack } from '@mui/material'
import { UseSortByInstanceProps, UseSortByState } from 'react-table'

import HeaderPopover from 'client/components/Header/Popover'
import { Translate } from 'client/components/HOC'
import { T } from 'client/constants'

/**
 * Render all selected sorters.
 *
 * @returns {ReactElement} Component JSX
 */
const GlobalSort = memo(
  (useTableProps) => {
    /** @type {UseSortByInstanceProps} */
    const { headers, state } = useTableProps

    /** @type {UseSortByInstanceProps} */
    const { setSortBy } = useTableProps

    /** @type {UseSortByState} */
    const { sortBy } = state

    const sorters = useMemo(
      () =>
        headers
          .filter((header) => header.canSort && header.isVisible)
          .map((header) => {
            const sorter = sortBy.find((s) => s.id === header.id)

            return { ...header, ...sorter }
          }),
      [headers.length, sortBy?.[0]?.id, sortBy?.[0]?.desc]
    )

    const handleClick = (id, name, prevDesc = true) => {
      setSortBy([{ id, desc: !prevDesc, name }])
    }

    useEffect(() => () => setSortBy([]), [])

    if (sorters.length === 0) {
      return null
    }

    return (
      <Stack direction="row" gap="0.5em" flexWrap="wrap">
        <HeaderPopover
          id="sort-by-button"
          icon={<SortDown />}
          headerTitle={<Translate word={T.SortBy} />}
          buttonLabel={<Translate word={T.Sort} />}
          buttonProps={{
            'data-cy': 'sort-by-button',
            disableElevation: true,
            variant: sortBy?.length > 0 ? 'contained' : 'outlined',
            color: 'secondary',
          }}
          popperProps={{ placement: 'bottom-end' }}
        >
          {() => (
            <MenuList>
              {sorters?.map(({ id, Header: name, desc }) => (
                <MenuItem key={id} onClick={() => handleClick(id, name, desc)}>
                  {desc !== undefined && (desc ? <ArrowUp /> : <ArrowDown />)}
                  <Translate word={name} />
                </MenuItem>
              ))}
            </MenuList>
          )}
        </HeaderPopover>
      </Stack>
    )
  },
  (next, prev) =>
    next.headers?.length === prev.headers?.length &&
    next.state?.sortBy === prev.state?.sortBy
)

GlobalSort.propTypes = {
  preFilteredRows: PropTypes.array,
  state: PropTypes.object,
}

GlobalSort.displayName = 'GlobalSort'

export default GlobalSort
