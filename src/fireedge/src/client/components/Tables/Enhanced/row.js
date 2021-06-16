import * as React from 'react'
import PropTypes from 'prop-types'

const Row = ({ row, handleClick }) => {
  /** @type {import('react-table').Row} */
  const { getRowProps, cells, isSelected } = row

  const renderCell = React.useCallback(cell => (
    <div {...cell.getCellProps()} data-header={cell.column.Header}>
      {cell.render('Cell')}
    </div>
  ), [])

  return (
    <div {...getRowProps()}
      className={isSelected ? 'selected' : ''}
      onClick={handleClick}
    >
      {cells?.map(renderCell)}
    </div>
  )
}

Row.propTypes = {
  row: PropTypes.object,
  handleClick: PropTypes.func
}

Row.defaultProps = {
  row: {},
  handleClick: undefined
}

export default Row
