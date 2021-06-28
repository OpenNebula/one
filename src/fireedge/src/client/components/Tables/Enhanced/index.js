import * as React from 'react'
import PropTypes from 'prop-types'

import { InfoEmpty } from 'iconoir-react'
import { Box, LinearProgress } from '@material-ui/core'
import {
  useGlobalFilter,
  useFilters,
  usePagination,
  useRowSelect,
  useSortBy,
  useTable
} from 'react-table'

import SplitPane from 'client/components/SplitPane'
import Toolbar from 'client/components/Tables/Enhanced/toolbar'
import Pagination from 'client/components/Tables/Enhanced/pagination'
import Filters from 'client/components/Tables/Enhanced/filters'
import DefaultFilter from 'client/components/Table/Filters/DefaultFilter'
import EnhancedTableStyles from 'client/components/Tables/Enhanced/styles'

import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'

const EnhancedTable = ({
  canFetchMore,
  columns,
  data,
  fetchMore,
  getRowId,
  isLoading,
  pageSize = 10,
  renderAllSelected = true,
  renderDetail,
  RowComponent,
  showPageCount
}) => {
  const classes = EnhancedTableStyles()

  const isFetching = isLoading && data === undefined

  const defaultColumn = React.useMemo(() => ({
    Filter: DefaultFilter,
    disableFilters: true
  }), [])

  const sortTypes = React.useMemo(() => ({
    length: (rowA, rowB, columnId, desc) => desc
      ? rowB.values[columnId].length - rowA.values[columnId].length
      : rowA.values[columnId].length - rowB.values[columnId].length
  }), [])

  const useTableProps = useTable(
    {
      columns,
      data,
      defaultColumn,
      sortTypes,
      getRowId,
      // When table has update, disable all of the auto resetting
      autoResetExpanded: false,
      autoResetFilters: false,
      autoResetGroupBy: false,
      autoResetPage: false,
      autoResetRowState: false,
      autoResetSelectedRow: false,
      autoResetSelectedRows: false,
      autoResetSortBy: false,
      // -------------------------------------
      initialState: {
        pageSize
      }
    },
    useGlobalFilter,
    useFilters,
    useSortBy,
    usePagination,
    useRowSelect
  )

  const {
    getTableProps,
    prepareRow,
    preFilteredRows,
    rows,
    page,
    gotoPage,
    pageCount,
    state: { pageIndex, selectedRowIds }
  } = useTableProps

  const selectedRows = React.useMemo(
    () => preFilteredRows.filter(row => !!selectedRowIds[row.id]),
    [preFilteredRows, selectedRowIds]
  )

  const handleChangePage = newPage => {
    gotoPage(newPage)

    const canNextPage = pageCount === -1 ? page.length >= pageSize : newPage < pageCount - 1

    newPage > pageIndex && canFetchMore && !canNextPage && fetchMore?.()
  }

  return (
    <SplitPane>
      <Box {...getTableProps()} className={classes.root}>
        <div className={classes.toolbar}>
          {!isFetching && <Toolbar useTableProps={useTableProps} />}
          <div className={classes.pagination}>
            {page?.length > 0 && (
              <Pagination
                handleChangePage={handleChangePage}
                useTableProps={useTableProps}
                count={rows.length}
                showPageCount={showPageCount}
              />
            )}
          </div>
        </div>

        {isLoading && (
          <LinearProgress size='1em' color='secondary' className={classes.loading} />
        )}

        <div className={classes.table}>
          {!isFetching && <Filters useTableProps={useTableProps} />}

          <div className={classes.body}>
            {/* NO DATA MESSAGE */}
            {!isFetching && page?.length === 0 && (
              <span className={classes.noDataMessage}>
                <InfoEmpty />
                {Tr(T.NoDataAvailable)}
              </span>
            )}

            {/* DATALIST PER PAGE */}
            {page.map(row => {
              prepareRow(row)

              /** @type {import('react-table').UseRowSelectRowProps} */
              const { getRowProps, original, values, toggleRowSelected, isSelected } = row
              const { key, ...rowProps } = getRowProps()

              return (
                <RowComponent
                  {...rowProps}
                  key={key}
                  original={original}
                  value={values}
                  className={isSelected ? 'selected' : ''}
                  onClick={() => toggleRowSelected(!isSelected)}
                />
              )
            })}
          </div>
        </div>
      </Box>

      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
        {selectedRows?.length === 1 && renderDetail
          ? renderDetail?.(selectedRows[0]?.values)
          : renderAllSelected && (
            <pre>
              <code>
                {JSON.stringify(Object.keys(selectedRowIds)?.join(', '), null, 2)}
              </code>
            </pre>
          )
        }
      </div>
    </SplitPane>
  )
}

EnhancedTable.propTypes = {
  canFetchMore: PropTypes.bool,
  columns: PropTypes.array,
  data: PropTypes.array,
  fetchMore: PropTypes.func,
  getRowId: PropTypes.func,
  isLoading: PropTypes.bool,
  pageSize: PropTypes.number,
  renderAllSelected: PropTypes.bool,
  renderDetail: PropTypes.func,
  RowComponent: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ]),
  showPageCount: PropTypes.bool
}

export default EnhancedTable
