import * as React from 'react'
import PropTypes from 'prop-types'

import { makeStyles, Box } from '@material-ui/core'

const useStyles = makeStyles(theme => ({
  root: {
    textTransform: 'uppercase',
    fontSize: '0.9em',
    fontWeight: 700,
    lineHeight: '1rem',
    letterSpacing: '0.05em',

    overflowWrap: 'break-word',
    textAlign: 'start',
    padding: '1em',

    color: '#4A5568',
    backgroundColor: '#e6e8f7',
    borderBlock: '0.5px solid #EDF2F7'
  }
}))

const Header = ({ useTableProps }) => {
  const classes = useStyles()

  /** @type {import('react-table').UseTableInstanceProps} */
  const { headerGroups } = useTableProps

  const renderHeaderColumn = React.useCallback(column => (
    <Box {...column.getHeaderProps()}>
      {column.render('Header')}
    </Box>
  ), [])

  const renderHeaderGroup = React.useCallback(headerGroup => (
    <Box {...headerGroup.getHeaderGroupProps()}>
      {headerGroup.headers.map(renderHeaderColumn)}
    </Box>
  ), [])

  return (
    <Box className={classes.root}>
      {headerGroups.map(renderHeaderGroup)}
    </Box>
  )
}

Header.propTypes = {
  useTableProps: PropTypes.object
}

Header.defaultProps = {
  useTableProps: {}
}

export default Header
