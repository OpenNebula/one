/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-key */
import * as React from 'react'

import { makeStyles, Box, CircularProgress } from '@material-ui/core'
import {
  useTable,
  useGlobalFilter,
  useRowSelect,
  useFlexLayout
} from 'react-table'

import { ListVirtualized } from 'client/components/List'
import Toolbar from 'client/components/Tables/Virtualized/toolbar'
import Header from 'client/components/Tables/Virtualized/header'
import Row from 'client/components/Tables/Virtualized/row'

const useStyles = makeStyles(theme => ({
  root: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column'
  },
  table: {
    height: '100%',
    overflow: 'hidden',
    borderTop: 0,
    border: `1px solid ${theme.palette.action.disabledBackground}`,
    borderRadius: '0 0 6px 6px',

    '& *[role=row]': {
      fontSize: '1em',
      fontWeight: theme.typography.fontWeightMedium,
      lineHeight: '1rem',

      overflowWrap: 'break-word',
      textAlign: 'start',
      padding: '1em',
      alignItems: 'center',

      color: theme.palette.text.primary,
      borderTop: `1px solid ${theme.palette.action.disabledBackground}`,
      '&:hover': {
        backgroundColor: theme.palette.action.hover
      },
      '&:first-of-type': {
        borderTopColor: 'transparent'
      }
    }
  },
  header: {
    ...theme.typography.body1,
    color: theme.palette.text.hint,
    marginBottom: 16,

    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1em'
  },
  total: {
    display: 'flex',
    alignItems: 'center',
    gap: '1em',
    transition: 200
  }
}))

const DefaultCell = React.memo(({ value }) => value ?? '--')
DefaultCell.displayName = 'DefaultCell'

const VirtualizedTable = ({ data, columns, isLoading, canFetchMore, fetchMore }) => {
  const classes = useStyles()

  const defaultColumn = React.useMemo(() => ({
    // Filter: DefaultFilter,
    Cell: DefaultCell
  }), [])

  const useTableProps = useTable(
    { columns, data, defaultColumn },
    useRowSelect,
    useFlexLayout,
    useGlobalFilter
  )

  const { getTableProps, getTableBodyProps, rows } = useTableProps

  return (
    <Box {...getTableProps()} className={classes.root}>

      <div className={classes.header}>
        <Toolbar useTableProps={useTableProps} />
        <div className={classes.total}>
          {isLoading && <CircularProgress size='1em' color='secondary' />}
            Total loaded: {useTableProps.rows.length}
        </div>
      </div>

      <Header useTableProps={useTableProps} />
      <div className={classes.table}>
        <ListVirtualized
          containerProps={{ ...getTableBodyProps() }}
          canFetchMore={canFetchMore}
          data={rows}
          isLoading={isLoading}
          fetchMore={fetchMore}
        >
          {virtualItems => virtualItems?.map(virtualRow => (
            <Row key={virtualRow.index}
              virtualRow={virtualRow}
              useTableProps={useTableProps}
            />
          ))
          }
        </ListVirtualized>
      </div>
    </Box>
  )
}

export default VirtualizedTable
