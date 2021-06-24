import React from 'react'
import PropTypes from 'prop-types'

import { makeStyles, MenuItem, MenuList, Chip } from '@material-ui/core'
import { SortDown, ArrowDown, ArrowUp } from 'iconoir-react'

import HeaderPopover from 'client/components/Header/Popover'
import { T } from 'client/constants'

const useStyles = makeStyles(theme => ({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center'
  },
}))

const GlobalSort = props => {
  const classes = useStyles()

  /**
   * @type {import('react-table').TableInstance &
   *        import('react-table').UseSortByInstanceProps &
   *        import('react-table').UseSortByState}
   */
  const { headers, sortBy, setSortBy } = props

  const sortAvailable = React.useMemo(() => {
    const flatSorters = sortBy.map(({ id }) => id)

    return headers.filter(({ id }) => !flatSorters.includes(id))
  }, [sortBy.length])

  const handleClick = (id, name) => {
    setSortBy([{ id, desc: false, name }, ...sortBy])
  }

  const handleDelete = removeId => {
    setSortBy(sortBy.filter(({id}) => id !== removeId))
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
            disabled: sortAvailable.length === 0,
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
              {sortAvailable.length
                ? sortAvailable?.map(({ id, Header: name }) => (
                  <MenuItem key={id} onClick={() => { handleClick(id, name) }}>
                    {name}
                  </MenuItem>
                ))
                : <span>{T.Empty}</span>
              }
            </MenuList>
          )}
        </HeaderPopover>
      ), [sortAvailable.length])}

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
  headers: PropTypes.array.isRequired,
  preSortedRows: PropTypes.array.isRequired,
  sortBy: PropTypes.array.isRequired,
  setSortBy: PropTypes.func.isRequired
}

export default GlobalSort
