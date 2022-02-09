/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
import { useEffect, useMemo, JSXElementConstructor } from 'react'
import PropTypes from 'prop-types'

import { SortDown, ArrowDown, ArrowUp } from 'iconoir-react'
import { MenuItem, MenuList, Chip, Stack } from '@mui/material'
import {
  TableInstance,
  UseSortByInstanceProps,
  UseSortByState,
} from 'react-table'

import HeaderPopover from 'client/components/Header/Popover'
import { T } from 'client/constants'

/**
 * Render all selected sorters.
 *
 * @param {object} props - Props
 * @param {TableInstance} props.useTableProps - Table props
 * @returns {JSXElementConstructor} Component JSX
 */
const GlobalSort = ({ useTableProps }) => {
  const { headers, state } = useTableProps

  /** @type {UseSortByInstanceProps} */
  const { setSortBy } = useTableProps

  /** @type {UseSortByState} */
  const { sortBy } = state

  useEffect(() => () => setSortBy([]), [])

  const headersNotSorted = useMemo(
    () =>
      headers.filter(
        ({ isSorted, canSort, isVisible }) => !isSorted && canSort && isVisible
      ),
    [sortBy.length]
  )

  const handleClick = (id, name) => {
    setSortBy([{ id, desc: false, name }, ...sortBy])
  }

  const handleDelete = (removeId) => {
    setSortBy(sortBy.filter(({ id }) => id !== removeId))
  }

  const handleToggle = (id, desc) => {
    setSortBy(sortBy.map((sort) => (sort.id === id ? { ...sort, desc } : sort)))
  }

  return (
    <Stack direction="row" gap="0.5em" flexWrap="wrap">
      {useMemo(
        () => (
          <HeaderPopover
            id="sort-by-button"
            icon={<SortDown />}
            buttonLabel={T.SortBy}
            buttonProps={{
              'data-cy': 'sort-by-button',
              disabled: headersNotSorted.length === 0,
              variant: 'outlined',
              color: 'secondary',
            }}
            popperProps={{ placement: 'bottom-start' }}
          >
            {() => (
              <MenuList>
                {headersNotSorted.length ? (
                  headersNotSorted?.map(({ id, Header: name }) => (
                    <MenuItem
                      key={id}
                      onClick={() => {
                        handleClick(id, name)
                      }}
                    >
                      {name}
                    </MenuItem>
                  ))
                ) : (
                  <span>{T.Empty}</span>
                )}
              </MenuList>
            )}
          </HeaderPopover>
        ),
        [headersNotSorted.length]
      )}

      {useMemo(
        () =>
          sortBy?.map(({ name, id, desc }) => (
            <Chip
              key={`${id}-${desc ? 'desc' : 'asc'}`}
              icon={desc ? <ArrowUp /> : <ArrowDown />}
              label={name ?? id}
              onClick={() => handleToggle(id, !desc)}
              onDelete={() => handleDelete(id)}
            />
          )),
        [sortBy.length, handleToggle]
      )}
    </Stack>
  )
}

GlobalSort.propTypes = {
  useTableProps: PropTypes.object.isRequired,
}

export default GlobalSort
