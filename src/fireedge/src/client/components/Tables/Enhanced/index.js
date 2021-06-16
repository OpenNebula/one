/* eslint-disable react/prop-types */
import * as React from 'react'

import { makeStyles, Box, CircularProgress, useMediaQuery } from '@material-ui/core'
import {
  useGlobalFilter,
  usePagination,
  useRowSelect,
  useTable
} from 'react-table'

import Toolbar from 'client/components/Tables/Virtualized/toolbar'
import Header from 'client/components/Tables/Virtualized/header'
import Row from 'client/components/Tables/Enhanced/row'
import Pagination from 'client/components/Tables/Enhanced/pagination'

import { addOpacityToColor } from 'client/utils'

const useStyles = makeStyles(({ palette, typography, breakpoints }) => ({
  root: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column'
  },
  table: {
    height: '100%',
    overflow: 'auto',
    [breakpoints.up('md')]: {
      border: `1px solid ${palette.action.disabledBackground}`,
      borderRadius: 6
    },
    // includes header row
    '& *[role=row]': {
      padding: '0.8em',
      textAlign: 'start',
      overflowWrap: 'break-word',
      lineHeight: '1rem',
      color: palette.text.primary,
      [breakpoints.up('md')]: {
        display: 'grid',
        gridAutoFlow: 'column',
        gridTemplateColumns: ({ columnsWidth }) => columnsWidth.join(' ')
      }
    }
  },
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 2,

    textTransform: 'uppercase',
    fontSize: '0.9em',
    fontWeight: 700,
    letterSpacing: '0.05em',
    borderBottom: 'transparent',
    backgroundColor: palette.grey[palette.type === 'light' ? 200 : 600],

    [breakpoints.down('sm')]: {
      display: 'none'
    }
  },
  body: {
    [breakpoints.only('sm')]: {
      display: 'grid',
      gap: '1em',
      gridTemplateColumns: '1fr 1fr'
    },
    [breakpoints.only('xm')]: {
      display: 'grid',
      gap: '1em',
      gridTemplateColumns: '1fr'
    },
    '& *[role=row]': {
      fontSize: '1em',
      fontWeight: typography.fontWeightMedium,
      borderTop: `1px solid ${palette.action.disabledBackground}`,
      backgroundColor: palette.background.paper,
      '&:hover': {
        backgroundColor: palette.action.hover
      },
      '&:first-of-type': {
        borderTopColor: 'transparent'
      },
      '&.selected': {
        backgroundColor: addOpacityToColor(palette.secondary.main, 0.7)
      }
    },
    '& *[role=cell]': {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  },
  toolbar: {
    ...typography.body1,
    color: palette.text.hint,
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

const EnhancedTable = ({
  data,
  columns,
  pageSize = 10,
  isLoading,
  showPageCount,
  fetchMore,
  canFetchMore,
  MobileComponentRow
}) => {
  const columnsWidth = React.useMemo(() =>
    columns.map(({ width = '1fr' }) => {
      return Number.isInteger(width) ? `${width}px` : width
    }), [])

  const isMobile = useMediaQuery(theme => theme.breakpoints.down('sm'))
  const classes = useStyles({ columnsWidth })

  const defaultColumn = React.useMemo(() => ({
    // Filter: DefaultFilter,
    Cell: DefaultCell
  }), [])

  const useTableProps = useTable(
    {
      columns,
      data,
      defaultColumn,
      autoResetPage: false,
      initialState: {
        pageSize
      }
    },
    useGlobalFilter,
    usePagination,
    useRowSelect
  )

  const {
    getTableProps,
    prepareRow,
    rows,
    page,
    gotoPage,
    pageCount,
    state: { pageIndex }
  } = useTableProps

  const handleChangePage = newPage => {
    gotoPage(newPage)

    const canNextPage = pageCount === -1 ? page.length >= pageSize : newPage < pageCount - 1

    newPage > pageIndex && canFetchMore && !canNextPage && fetchMore()
  }

  return (
    <Box {...getTableProps()} className={classes.root}>

      <div className={classes.toolbar}>
        <Toolbar useTableProps={useTableProps} />
        <div className={classes.total}>
          {isLoading && <CircularProgress size='1em' color='secondary' />}
            Total loaded: {rows.length}
        </div>
      </div>

      <div className={classes.table}>
        <div className={classes.header}>
          <Header useTableProps={useTableProps} />
        </div>

        <div className={classes.body}>
          {
            page.map(row => {
              prepareRow(row)

              /** @type {import('react-table').UseRowSelectRowProps} */
              const { getRowProps, original, toggleRowSelected, isSelected } = row

              const key = getRowProps().key
              const handleSelect = () => toggleRowSelected(!isSelected)

              return isMobile && MobileComponentRow ? (
                <MobileComponentRow
                  key={key}
                  value={original}
                  isSelected={isSelected}
                  handleClick={handleSelect}
                />
              ) : (
                <Row
                  key={key}
                  row={row}
                  handleClick={handleSelect}
                />
              )
            })}
        </div>
      </div>

      {page?.length > 0 && (
        <Pagination
          handleChangePage={handleChangePage}
          useTableProps={useTableProps}
          count={rows.length}
          showPageCount={showPageCount}
        />
      )}
    </Box>
  )
}

export default EnhancedTable
