/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
 *                                                                           *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may   *
 * not use this file except in compliance with the License. You may obtain   *
 * a copy of the License at                                                  *
 *                                                                           *
 * http://www.apache.org/licenses/LICENSE-2.0                                *
 *                                                                           *
 * Unless required by applicable law or agreed to in writing, software       *
 * distributed under the License is distributed on an "AS IS" BASIS,         *
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  *
 * See the License for the specific language governing permissions and       *
 * limitations under the License.                                            *
 * ------------------------------------------------------------------------- */
/* eslint-disable jsdoc/require-jsdoc */
import { useMemo } from 'react'
import PropTypes from 'prop-types'

import clsx from 'clsx'
import { InfoEmpty } from 'iconoir-react'
import { Box } from '@mui/material'
import {
  useGlobalFilter,
  useFilters,
  usePagination,
  useRowSelect,
  useSortBy,
  useTable,
  useMountedLayoutEffect,
  // types
  UseRowSelectRowProps,
} from 'react-table'

import Pagination from 'client/components/Tables/Enhanced/pagination'
import {
  GlobalActions,
  GlobalSearch,
  GlobalFilter,
  GlobalSort,
  GlobalSelectedRows,
} from 'client/components/Tables/Enhanced/Utils'
import EnhancedTableStyles from 'client/components/Tables/Enhanced/styles'

import { Translate } from 'client/components/HOC'
import { T } from 'client/constants'

const EnhancedTable = ({
  columns,
  globalActions,
  globalFilter,
  data,
  fetchMore,
  getRowId,
  initialState,
  refetch,
  isLoading,
  displaySelectedRows,
  disableRowSelect,
  disableGlobalSort,
  onSelectedRowsChange,
  pageSize = 10,
  onRowClick,
  RowComponent,
  showPageCount,
  singleSelect = false,
  classes = {},
  rootProps = {},
  searchProps = {},
}) => {
  const styles = EnhancedTableStyles()

  const isUninitialized = useMemo(
    () => isLoading && data === undefined,
    [isLoading, data?.length]
  )

  const defaultColumn = useMemo(() => ({ disableFilters: true }), [])

  const sortTypes = useMemo(
    () => ({
      length: (rowA, rowB, columnId, desc) =>
        desc
          ? rowB.values[columnId].length - rowA.values[columnId].length
          : rowA.values[columnId].length - rowB.values[columnId].length,
    }),
    []
  )

  const useTableProps = useTable(
    {
      columns,
      data,
      defaultColumn,
      globalFilter,
      sortTypes,
      getRowId,
      // When table has update, disable all of the auto resetting
      autoResetHiddenColumns: false,
      autoResetExpanded: false,
      autoResetFilters: false,
      autoResetGroupBy: false,
      autoResetRowState: false,
      autoResetSelectedRow: false,
      autoResetSelectedRows: false,
      autoResetSortBy: false,
      // -------------------------------------
      initialState: {
        pageSize,
        ...initialState,
      },
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
    toggleAllRowsSelected,
    preFilteredRows,
    rows,
    page,
    gotoPage,
    pageCount,
    state: { pageIndex, selectedRowIds },
  } = useTableProps

  useMountedLayoutEffect(() => {
    const selectedRows = preFilteredRows.filter(
      (row) => !!selectedRowIds[row.id]
    )

    onSelectedRowsChange?.(selectedRows)
  }, [selectedRowIds])

  const handleChangePage = (newPage) => {
    gotoPage(newPage)

    const canNextPage =
      pageCount === -1 ? page.length >= pageSize : newPage < pageCount - 1

    newPage > pageIndex && !canNextPage && fetchMore?.()
  }

  return (
    <Box
      {...getTableProps()}
      className={clsx(styles.root, classes.root)}
      {...rootProps}
    >
      <div className={styles.toolbar}>
        {/* ACTIONS */}
        <GlobalActions
          className={styles.actions}
          refetch={refetch}
          isLoading={isLoading}
          singleSelect={singleSelect}
          disableRowSelect={disableRowSelect}
          globalActions={globalActions}
          useTableProps={useTableProps}
        />

        {/* PAGINATION */}
        <Pagination
          className={styles.pagination}
          handleChangePage={handleChangePage}
          useTableProps={useTableProps}
          count={rows.length}
          showPageCount={showPageCount}
        />

        {/* SEARCH */}
        <GlobalSearch
          className={styles.search}
          useTableProps={useTableProps}
          searchProps={searchProps}
        />

        {/* FILTERS */}
        <div className={styles.filters}>
          <GlobalFilter useTableProps={useTableProps} />
          {!disableGlobalSort && <GlobalSort useTableProps={useTableProps} />}
        </div>

        {/* SELECTED ROWS */}
        {displaySelectedRows && (
          <div>
            <GlobalSelectedRows useTableProps={useTableProps} />
          </div>
        )}
      </div>

      <div className={clsx(styles.body, classes.body)}>
        {/* NO DATA MESSAGE */}
        {!isUninitialized && page?.length === 0 && (
          <span className={styles.noDataMessage}>
            <InfoEmpty />
            <Translate word={T.NoDataAvailable} />
          </span>
        )}

        {/* DATALIST PER PAGE */}
        {page.map((row) => {
          prepareRow(row)

          /** @type {UseRowSelectRowProps} */
          const {
            getRowProps,
            original,
            values,
            toggleRowSelected,
            isSelected,
          } = row
          const { key, ...rowProps } = getRowProps()

          return (
            <RowComponent
              {...rowProps}
              key={key}
              original={original}
              value={values}
              className={isSelected ? 'selected' : ''}
              onClick={() => {
                typeof onRowClick === 'function' && onRowClick(original)

                if (!disableRowSelect) {
                  singleSelect && toggleAllRowsSelected?.(false)
                  toggleRowSelected?.(!isSelected)
                }
              }}
            />
          )
        })}
      </div>
    </Box>
  )
}

EnhancedTable.propTypes = {
  canFetchMore: PropTypes.bool,
  globalActions: PropTypes.array,
  columns: PropTypes.array,
  data: PropTypes.array,
  globalFilter: PropTypes.func,
  fetchMore: PropTypes.func,
  getRowId: PropTypes.func,
  initialState: PropTypes.object,
  classes: PropTypes.shape({
    root: PropTypes.string,
    body: PropTypes.string,
  }),
  rootProps: PropTypes.shape({
    'data-cy': PropTypes.string,
  }),
  searchProps: PropTypes.shape({
    'data-cy': PropTypes.string,
  }),
  refetch: PropTypes.func,
  isLoading: PropTypes.bool,
  disableGlobalSort: PropTypes.bool,
  disableRowSelect: PropTypes.bool,
  displaySelectedRows: PropTypes.bool,
  onSelectedRowsChange: PropTypes.func,
  onRowClick: PropTypes.func,
  pageSize: PropTypes.number,
  RowComponent: PropTypes.any,
  showPageCount: PropTypes.bool,
  singleSelect: PropTypes.bool,
}

export * from 'client/components/Tables/Enhanced/Utils'

export default EnhancedTable
