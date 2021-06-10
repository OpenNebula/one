import * as React from 'react'
import PropTypes from 'prop-types'

import { makeStyles, Box } from '@material-ui/core'
import clsx from 'clsx'

const useStyles = makeStyles(theme => ({
  root: {
    // <-- it's needed to virtualize -->
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',

    fontSize: '1em',
    fontWeight: theme.typography.fontWeightMedium,
    lineHeight: '1rem',

    overflowWrap: 'break-word',
    textAlign: 'start',
    padding: '1em',
    alignItems: 'center',

    boxShadow: '0 0 0 0.5px #e6e8f7'
  },
  virtual: ({ size, start }) => ({
    height: size,
    transform: `translateY(${start}px)`
  })
}))

const Row = ({ virtualRow, useTableProps }) => {
  /** @type {import('react-virtual').VirtualItem} */
  const { index, measureRef, size, start } = virtualRow

  const classes = useStyles({ size, start })

  /** @type {import('react-table').UseTableInstanceProps} */
  const { rows, prepareRow } = useTableProps

  /** @type {import('react-table').UseTableRowProps} */
  const row = rows[index]

  prepareRow(row)

  const renderCell = React.useCallback(cell => (
    <Box {...cell.getCellProps()}>
      {cell.render('Cell')}
    </Box>
  ), [])

  return (
    <Box {...row.getRowProps()}
      ref={measureRef}
      className={clsx(classes.root, classes.virtual)}
    >
      {row?.cells?.map(renderCell)}
    </Box>
  )
}

Row.propTypes = {
  virtualRow: PropTypes.object,
  useTableProps: PropTypes.object
}

Row.defaultProps = {
  virtualRow: {},
  useTableProps: {}
}

export default Row
