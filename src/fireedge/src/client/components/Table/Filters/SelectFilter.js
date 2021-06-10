import React from 'react'
import PropTypes from 'prop-types'

import { T } from 'client/constants'

const SelectFilter = ({ column, accessorOption }) => {
  /** @type {import('react-table').UseFiltersInstanceProps} */
  const { filterValue, setFilter, preFilteredRows, id } = column

  // Calculate the options for filtering using the preFilteredRows
  const options = React.useMemo(() => {
    const options = new Set()

    preFilteredRows.forEach(row => {
      options.add(row.values[id])
    })

    return [...options.values()]
  }, [id, preFilteredRows])

  return (
    <select
      value={filterValue}
      onChange={event => {
        setFilter(event.target.value || undefined)
      }}
    >
      <option value=''>{T.All}</option>
      {options.map((option, i) => {
        const value = option[accessorOption] ?? option

        return (
          <option key={i} value={value}>
            {value}
          </option>
        )
      })}
    </select>
  )
}

SelectFilter.propTypes = {
  column: PropTypes.shape({
    filterValue: PropTypes.any,
    preFilteredRows: PropTypes.array,
    setFilter: PropTypes.func.isRequired,
    id: PropTypes.string.isRequired
  }),
  accessorOption: PropTypes.string
}

export default SelectFilter
