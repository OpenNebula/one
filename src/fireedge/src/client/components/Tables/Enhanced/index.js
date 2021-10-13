/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
import { Box, LinearProgress } from '@mui/material'
import {
  useGlobalFilter,
  useFilters,
  usePagination,
  useRowSelect,
  useSortBy,
  useTable,
  useMountedLayoutEffect,
  // types
  UseRowSelectRowProps
} from 'react-table'

import Toolbar from 'client/components/Tables/Enhanced/toolbar'
import Pagination from 'client/components/Tables/Enhanced/pagination'
import Filters from 'client/components/Tables/Enhanced/filters'
import { ActionPropTypes } from 'client/components/Tables/Enhanced/Utils'
import EnhancedTableStyles from 'client/components/Tables/Enhanced/styles'

import { Translate } from 'client/components/HOC'
import { T } from 'client/constants'

const EnhancedTable = ({
  canFetchMore,
  columns,
  globalActions,
  data,
  fetchMore,
  getRowId,
  initialState,
  isLoading,
  onlyGlobalSearch,
  onlyGlobalSelectedRows,
  onSelectedRowsChange,
  pageSize = 10,
  RowComponent,
  showPageCount,
  singleSelect = false,
  classes = {}
}) => {
  const styles = EnhancedTableStyles()

  const isFetching = isLoading && data === undefined

  const defaultColumn = useMemo(() => ({
    disableFilters: true
  }), [])

  const sortTypes = useMemo(() => ({
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
      autoResetHiddenColumns: false,
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
        pageSize,
        ...initialState
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
    toggleAllRowsSelected,
    preFilteredRows,
    rows,
    page,
    gotoPage,
    pageCount,
    state: { pageIndex, selectedRowIds }
  } = useTableProps

  useMountedLayoutEffect(() => {
    const selectedRows = preFilteredRows.filter(row => !!selectedRowIds[row.id])

    onSelectedRowsChange?.(selectedRows)
  }, [selectedRowIds])

  const handleChangePage = newPage => {
    gotoPage(newPage)

    const canNextPage = pageCount === -1 ? page.length >= pageSize : newPage < pageCount - 1

    newPage > pageIndex && canFetchMore && !canNextPage && fetchMore?.()
  }

  return (
    <Box {...getTableProps()} className={clsx(styles.root, classes.root)}>
      <div className={styles.toolbar}>
        {/* TOOLBAR */}
        {!isFetching && (
          <Toolbar
            globalActions={globalActions}
            onlyGlobalSelectedRows={onlyGlobalSelectedRows}
            useTableProps={useTableProps}
          />
        )}

        {/* PAGINATION */}
        <div className={styles.pagination}>
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
        <LinearProgress size='1em' color='secondary' className={styles.loading} />
      )}

      <div className={styles.table}>
        {/* FILTERS */}
        {!isFetching && (
          <Filters
            onlyGlobalSearch={onlyGlobalSearch}
            useTableProps={useTableProps}
          />
        )}

        <div className={clsx(styles.body, classes.body)}>
          {/* NO DATA MESSAGE */}
          {!isFetching && page?.length === 0 && (
            <span className={styles.noDataMessage}>
              <InfoEmpty />
              <Translate word={T.NoDataAvailable} />
            </span>
          )}

          {/* DATALIST PER PAGE */}
          {page.map(row => {
            prepareRow(row)

            /** @type {UseRowSelectRowProps} */
            const { getRowProps, original, values, toggleRowSelected, isSelected } = row
            const { key, ...rowProps } = getRowProps()

            return (
              <RowComponent
                {...rowProps}
                key={key}
                original={original}
                value={values}
                className={isSelected ? 'selected' : ''}
                onClick={() => {
                  singleSelect && toggleAllRowsSelected(false)
                  toggleRowSelected(!isSelected)
                }}
              />
            )
          })}
        </div>
      </div>
    </Box>
  )
}

export const EnhancedTableProps = {
  canFetchMore: PropTypes.bool,
  globalActions: PropTypes.arrayOf(ActionPropTypes),
  columns: PropTypes.array,
  data: PropTypes.array,
  fetchMore: PropTypes.func,
  getRowId: PropTypes.func,
  initialState: PropTypes.object,
  classes: PropTypes.shape({
    root: PropTypes.string,
    body: PropTypes.string
  }),
  isLoading: PropTypes.bool,
  onlyGlobalSearch: PropTypes.bool,
  onlyGlobalSelectedRows: PropTypes.bool,
  onSelectedRowsChange: PropTypes.func,
  pageSize: PropTypes.number,
  RowComponent: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
    PropTypes.func
  ]),
  showPageCount: PropTypes.bool,
  singleSelect: PropTypes.bool
}

EnhancedTable.propTypes = EnhancedTableProps

export default EnhancedTable
