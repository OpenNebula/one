import * as React from 'react'
import PropTypes from 'prop-types'

import { List, ListSubheader, ListItem, Typography, IconButton } from '@material-ui/core'
import { Cancel } from 'iconoir-react'

import { Tr } from 'client/components/HOC'

// FILTER FUNCTION
export const categoryFilterFn = (accessorOption, rows, columnsId, filterValue) =>
  rows.filter(row =>
    columnsId.some(id => {
      const val = row.values[id][accessorOption] ?? row.values[id]

      return filterValue.includes(val)
    })
  )

categoryFilterFn.autoRemove = val => !val || !val.length

// ***************************************************************

const CategoryFilter = ({ title, column, accessorOption, multiple }) => {
  /** @type {import('react-table').UseFiltersInstanceProps} */
  const {
    setFilter,
    id,
    preFilteredRows,
    filterValue = multiple ? [] : undefined
  } = column

  React.useEffect(() => () => setFilter(multiple ? [] : undefined), [])

  // Calculate the options for filtering using the preFilteredRows
  const options = React.useMemo(() => {
    const options = new Set()

    preFilteredRows?.forEach(row => {
      options.add(row.values[id])
    })

    return [...options.values()]
  }, [id])

  const handleSelect = value => setFilter(
    multiple ? [...filterValue, value] : value
  )

  const handleUnselect = value => setFilter(
    multiple ? filterValue.filter(v => v !== value) : undefined
  )

  const handleClear = () => setFilter(multiple ? [] : undefined)

  const isFiltered = React.useMemo(() => (
    multiple ? filterValue?.length > 0 : filterValue !== undefined
  ), [filterValue])

  if (options.length === 0) {
    return null
  }

  return (
    <List dense disablePadding>
      {title && (
        <ListSubheader disableSticky disableGutters
          title={Tr(title)}
          style={{ display: 'flex', alignItems: 'center' }}
        >
          {Tr(title)}
          {isFiltered && (
            <IconButton disableRipple disablePadding size='small' onClick={handleClear}>
              <Cancel/>
            </IconButton>
          )}
        </ListSubheader>
      )}

      {options.map((option, i) => {
        const value = option[accessorOption] ?? option

        const isSelected = multiple
          ? filterValue?.includes?.(value)
          : value === filterValue

        return (
          <ListItem key={i} button
            selected={isSelected}
            onClick={() =>
              isSelected ? handleUnselect(value) : handleSelect(value)
            }
          >
            <Typography noWrap variant='subtitle2' title={value}>
              {value}
            </Typography>
          </ListItem>
        )
      })}
    </List>
  )
}

CategoryFilter.propTypes = {
  column: PropTypes.object,
  accessorOption: PropTypes.string,
  icon: PropTypes.node,
  title: PropTypes.string,
  multiple: PropTypes.bool
}

export default CategoryFilter
