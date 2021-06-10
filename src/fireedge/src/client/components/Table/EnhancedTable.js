import React from 'react'
import PropTypes from 'prop-types'

import {
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

import {
  useFilters,
  useGlobalFilter,
  usePagination,
  useRowSelect,
  useSortBy,
  useTable
} from 'react-table'

import TablePaginationActions from 'client/components/Table/TablePaginationActions'
import TableToolbar from 'client/components/Table/TableToolbar'
import * as TableFilters from 'client/components/Table/Filters'

const EnhancedTable = ({
  title,
  columns,
  data,
  actions,
  skipPageReset,
  filterTypes
}) => {
  const defaultColumn = React.useMemo(() => ({
    Filter: TableFilters.DefaultFilter
  }), [])

  const {
    getTableProps,
    headerGroups,
    prepareRow,
    page,
    gotoPage,
    setPageSize,
    preGlobalFilteredRows,
    setGlobalFilter,
    state: { pageIndex, pageSize, selectedRowIds, globalFilter }
  } = useTable(
    {
      columns,
      data,
      defaultColumn,
      filterTypes,
      autoResetPage: !skipPageReset

    },
    useFilters,
    useGlobalFilter,
    useSortBy,
    usePagination,
    useRowSelect
  )

  const handleChangePage = (_, newPage) => {
    gotoPage(newPage)
  }

  const handleChangeRowsPerPage = event => {
    setPageSize(parseInt(event.target.value, 10))
  }

  return (
    <TableContainer>
      <TableToolbar
        title={title}
        numSelected={Object.keys(selectedRowIds).length}
        actions={actions}
        preGlobalFilteredRows={preGlobalFilteredRows}
        setGlobalFilter={setGlobalFilter}
        globalFilter={globalFilter}
      />
      <MTable size='small' {...getTableProps()}>
        <TableHead>
          {headerGroups.map(headerGroup => (
            <TableRow {...headerGroup.getHeaderGroupProps()}>
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
            return (
              <TableRow {...row.getRowProps()}>
                {row.cells.map(cell => (
                  <TableCell {...cell.getCellProps()}>
                    {cell.render('Cell')}
                  </TableCell>
                ))}
              </TableRow>
            )
          })}
        </TableBody>

        <TableFooter>
          <TableRow>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, { label: 'All', value: -1 }]}
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
}

EnhancedTable.propTypes = {
  title: PropTypes.string.isRequired,
  columns: PropTypes.array.isRequired,
  data: PropTypes.array.isRequired,
  actions: PropTypes.array.isRequired,
  skipPageReset: PropTypes.bool,
  filterTypes: PropTypes.array
}

EnhancedTable.defaultProps = {
  skipPageReset: false
}

export default EnhancedTable
