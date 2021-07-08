/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
import * as React from 'react'
import PropTypes from 'prop-types'

import { makeStyles, MenuItem, MenuList, Chip } from '@material-ui/core'
import { SortDown, ArrowDown, ArrowUp } from 'iconoir-react'

import HeaderPopover from 'client/components/Header/Popover'
import { T } from 'client/constants'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center'
  }
})

const GlobalSort = ({ useTableProps }) => {
  const classes = useStyles()

  React.useEffect(() => () => setSortBy([]), [])

  /**
   * @type {import('react-table').UseSortByInstanceProps &
   *        import('react-table').TableInstance &
   * { state: import('react-table').UseSortByState }}
   */
  const { headers, setSortBy, state: { sortBy } } = useTableProps

  const headersNotSorted = React.useMemo(() =>
    headers.filter(({ isSorted, canSort, isVisible }) =>
      !isSorted && canSort && isVisible
    ), [sortBy.length])

  const handleClick = (id, name) => {
    setSortBy([{ id, desc: false, name }, ...sortBy])
  }

  const handleDelete = removeId => {
    setSortBy(sortBy.filter(({ id }) => id !== removeId))
  }

  const handleToggle = (id, desc) => {
    setSortBy(sortBy.map(sort => sort.id === id ? ({ ...sort, desc }) : sort))
  }

  return (
    <div className={classes.root}>
      {React.useMemo(() => (
        <HeaderPopover
          id='sort-by-button'
          icon={<SortDown />}
          buttonLabel={T.SortBy}
          buttonProps={{
            'data-cy': 'sort-by-button',
            disabled: headersNotSorted.length === 0,
            variant: 'outlined'
          }}
          popoverProps= {{
            anchorOrigin: {
              vertical: 'bottom',
              horizontal: 'left'
            },
            transformOrigin: {
              vertical: 'top',
              horizontal: 'left'
            }
          }}
        >
          {() => (
            <MenuList disablePadding>
              {headersNotSorted.length
                ? headersNotSorted?.map(({ id, Header: name }) => (
                  <MenuItem key={id} onClick={() => { handleClick(id, name) }}>
                    {name}
                  </MenuItem>
                ))
                : <span>{T.Empty}</span>
              }
            </MenuList>
          )}
        </HeaderPopover>
      ), [headersNotSorted.length])}

      {React.useMemo(() => sortBy?.map(({ name, id, desc }) => (
        <Chip
          key={`${id}-${desc ? 'desc' : 'asc'}`}
          icon={desc ? <ArrowUp /> : <ArrowDown />}
          label={name ?? id}
          onClick={() => handleToggle(id, !desc)}
          onDelete={() => handleDelete(id)}
        />
      )), [sortBy.length, handleToggle])}
    </div>
  )
}

GlobalSort.propTypes = {
  useTableProps: PropTypes.object.isRequired
}

export default GlobalSort
