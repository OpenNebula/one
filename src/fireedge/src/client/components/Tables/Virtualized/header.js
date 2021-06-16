import * as React from 'react'
import PropTypes from 'prop-types'

const Header = ({ useTableProps }) => {
  /** @type {import('react-table').UseTableInstanceProps} */
  const { headerGroups } = useTableProps

  const renderHeaderColumn = React.useCallback(column => (
    <div {...column.getHeaderProps()}>
      {column.render('Header')}
    </div>
  ), [])

  const renderHeaderGroup = React.useCallback(headerGroup => (
    <div {...headerGroup.getHeaderGroupProps()}>
      {headerGroup.headers.map(renderHeaderColumn)}
    </div>
  ), [])

  return headerGroups.map(renderHeaderGroup)
}

Header.propTypes = {
  useTableProps: PropTypes.object
}

Header.defaultProps = {
  useTableProps: {}
}

export default Header
