import * as React from 'react'
import PropTypes from 'prop-types'

import { List, ListSubheader, ListItem, Typography, IconButton } from '@material-ui/core'
import { Cancel } from 'iconoir-react'

import { Tr } from 'client/components/HOC'

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
    const options = {}

    preFilteredRows?.forEach(row => {
      const value = row.values[id]

      if (!value) return

      const count = options[value[accessorOption] ?? value] || 0
      options[value[accessorOption] ?? value] = count + 1
    })

    return options
  }, [id, preFilteredRows])

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

  if (Object.keys(options).length === 0) {
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

      {Object.entries(options).map(([option, count], i) => {
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
              {`${value} (${count})`}
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
