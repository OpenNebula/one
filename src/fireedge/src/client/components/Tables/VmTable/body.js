/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-key */
import * as React from 'react'
import PropTypes from 'prop-types'

import clsx from 'clsx'
import {
  makeStyles,
  fade,
  Table as MTable,
  TableFooter,
  TableContainer,
  TablePagination,
  TableSortLabel,
  TableBody,
  TableCell,
  TableHead,
  TableRow
} from '@material-ui/core'

import { TableToolbar, TablePaginationActions } from 'client/components/Table'

const useStyles = makeStyles(theme => ({
  table: {
    // borderCollapse: 'collapse',
    [theme.breakpoints.down('sm')]: {
      borderCollapse: 'separate',
      borderSpacing: theme.spacing(0, 4)
    }
  },
  head: {
    [theme.breakpoints.down('sm')]: {
      display: 'none'
    }
  },
  headRow: {
    [theme.breakpoints.down('sm')]: {
      display: 'block',
      marginBottom: 5
    }
  },
  bodyRow: {
    '&:nth-of-type(odd)': {
      // backgroundColor: theme.palette.action.hover
    },
    '&$selected, &$selected:hover': {
      backgroundColor: theme.palette.action.hover
      // backgroundColor: fade(theme.palette.secondary.main, theme.palette.action.selectedOpacity)
    }
  },
  cell: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    '&:first-of-type': {
      width: 45
    },
    [theme.breakpoints.down('sm')]: {
      '&:first-of-type': {
        display: 'none'
      },
      '&:last-of-type': {
        borderBottom: `1px solid ${theme.palette.primary.contrastText}`
      },
      '&:nth-of-type(2)': {
        borderTop: `1px solid ${theme.palette.primary.contrastText}`
      },
      borderInline: `1px solid ${theme.palette.primary.contrastText}`,
      display: 'block',
      position: 'relative',
      textAlign: 'left',
      borderBottom: 'none'
      // paddingLeft: 130,
      // '&::before': {
      //   content: 'attr(data-heading)',
      //   position: 'absolute',
      //   top: 0,
      //   left: 0,
      //   width: 120,
      //   height: '100%',
      //   display: 'flex',
      //   alignItems: 'center',
      //   backgroundColor: theme.palette.primary.main,
      //   color: theme.palette.primary.contrastText,
      //   fontSize: '0.75rem',
      //   padding: theme.spacing(0, 1),
      //   justifyContent: 'center'
      // }
    }
  },
  selected: {}
}))

const TableBod = ({
  getTableProps,
  headerGroups,
  prepareRow,
  page,
  gotoPage,
  setPageSize,
  preGlobalFilteredRows,
  setGlobalFilter,
  state: { pageIndex, pageSize, selectedRowIds, globalFilter },
  data
}) => {
  const classes = useStyles()

  const handleChangePage = (_, newPage) => {
    gotoPage(newPage)
  }

  const handleChangeRowsPerPage = event => {
    setPageSize(parseInt(event.target.value, 10))
  }

  return (
    <TableContainer>
      <TableToolbar
        numSelected={Object.keys(selectedRowIds).length}
        preGlobalFilteredRows={preGlobalFilteredRows}
        setGlobalFilter={setGlobalFilter}
        globalFilter={globalFilter}
      />
      <MTable size='small' stickyHeader {...getTableProps()} className={classes.table}>
        <TableHead className={classes.head}>
          {headerGroups.map(headerGroup => (
            <TableRow {...headerGroup.getHeaderGroupProps()} className={classes.headRow}>
              {headerGroup.headers.map(column => (
                <TableCell
                  {...(column.id === 'selection'
                    ? column.getHeaderProps()
                    : column.getHeaderProps(column.getSortByToggleProps()))}
                >
                  {column.render('Header')}
                  {column.id !== 'selection' ? (
                    <TableSortLabel
                      active={column.isSorted}
                      // react-table has a unsorted state which is not treated here
                      direction={column.isSortedDesc ? 'desc' : 'asc'}
                    />
                  ) : null}
                  {/* Render the columns filter UI */}
                  <div onClick={event => event.stopPropagation()}>
                    {column.canFilter ? column.render('Filter') : null}
                  </div>
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableHead>
        <TableBody>
          {page.map((row, i) => {
            prepareRow(row)
            const { onChange, checked } = row.getToggleRowSelectedProps()

            return (
              <TableRow {...row.getRowProps()} hover onClick={onChange} selected={checked} className={classes.bodyRow}>
                {row.cells.map(cell => {
                  console.log({ cell })
                  return (
                    <TableCell {...cell.getCellProps()} className={classes.cell} data-heading={cell.column.Header}>
                      {cell.render('Cell')}
                    </TableCell>
                  )
                })}
              </TableRow>
            )
          })}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              count={data.length}
              rowsPerPage={pageSize}
              page={pageIndex}
              SelectProps={{
                inputProps: { 'aria-label': 'rows per page' },
                native: true
              }}
              onChangePage={handleChangePage}
              onChangeRowsPerPage={handleChangeRowsPerPage}
              ActionsComponent={TablePaginationActions}
            />
          </TableRow>
        </TableFooter>
      </MTable>
    </TableContainer>
  )

  /* return (
    <Box
      {...getTableBodyProps()}
      height={`${rowVirtualizer.totalSize}px`}
      position='relative'
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        flexDirection: 'column',
        gap: '1em',
        margin: '0 0 3em 0',
        padding: 0,
        boxShadow: '0 0 40px rgba(0,0,0,0.2)'
      }}
    >
      {rowVirtualizer.virtualItems.map(virtualRow => {
        const row = rows[virtualRow.index]
        prepareRow(row)

        return <TableRow
          key={row.getRowProps().key}
          row={row}
          virtualRow={virtualRow}
        />
      })}
    </Box>
  ) */
}

TableBod.propTypes = {
}

TableBod.defaultProps = {
}

export default TableBod
