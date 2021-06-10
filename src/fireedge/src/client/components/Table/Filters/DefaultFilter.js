import React from 'react'
import PropTypes from 'prop-types'
import { debounce } from '@material-ui/core'

const DefaultFilter = ({ column }) => {
  /** @type {import('react-table').UseFiltersInstanceProps} */
  const { filterValue, preFilteredRows, setFilter } = column
  const count = preFilteredRows?.length

  const [value, setValue] = React.useState(filterValue)

  const handleChange = React.useCallback(
    // Set undefined to remove the filter entirely
    debounce(value => { setFilter(value || undefined) }, 200)
  )

  return (
    <input
      value={value || ''}
      onChange={event => {
        setValue(event.target.value)
        handleChange(event.target.value)
      }}
      placeholder={`Search ${count} records...`}
    />
  )
}

DefaultFilter.propTypes = {
  column: PropTypes.shape({
    filterValue: PropTypes.any,
    preFilteredRows: PropTypes.array,
    setFilter: PropTypes.func.isRequired
  })
}

export default DefaultFilter
