/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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
import PropTypes from 'prop-types'
import { useMemo } from 'react'

import { Alert, Box, Chip, Grid } from '@mui/material'
import clsx from 'clsx'
import InfoEmpty from 'iconoir-react/dist/InfoEmpty'
import RemoveIcon from 'iconoir-react/dist/RemoveSquare'

import {
  UseRowSelectRowProps,
  useFilters,
  useGlobalFilter,
  useMountedLayoutEffect,
  usePagination,
  useRowSelect,
  useSortBy,
  useTable,
} from 'react-table'

import {
  GlobalActions,
  GlobalFilter,
  GlobalLabel,
  GlobalSearch,
  GlobalSelectedRows,
  GlobalSort,
  LABEL_COLUMN_ID,
} from 'client/components/Tables/Enhanced/Utils'
import Pagination from 'client/components/Tables/Enhanced/pagination'
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
  useUpdateMutation,
  displaySelectedRows,
  disableRowSelect,
  disableGlobalLabel,
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
  noDataMessage,
  messages = [],
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
      autoResetPage: false,
      autoResetGlobalFilter: false,
      // -------------------------------------
      initialState: { pageSize, ...initialState },
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
    preGlobalFilteredRowsById,
    rows,
    page,
    gotoPage,
    pageCount,
    setFilter,
    setAllFilters,
    setSortBy,
    setGlobalFilter,
    state,
  } = useTableProps

  const gotoRowPage = async (row) => {
    const pageIdx = Math.floor(row.index / pageSize)

    await gotoPage(pageIdx)

    // scroll to the row in the table view (if it's visible)
    document
      ?.querySelector(`.selected[role='row'][data-cy$='-${row.id}']`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const selectedRows = useMemo(() => {
    const selectedIds = Object.keys(state.selectedRowIds ?? {})

    return selectedIds
      .map((id) => preGlobalFilteredRowsById[id])
      .filter(Boolean)
  }, [state.selectedRowIds])

  useMountedLayoutEffect(() => {
    onSelectedRowsChange?.(
      selectedRows.map((row) => ({ ...row, gotoPage: () => gotoRowPage(row) }))
    )
  }, [state.selectedRowIds])

  const handleChangePage = (newPage) => {
    gotoPage(newPage)

    const canNextPage =
      pageCount === -1 ? page.length >= pageSize : newPage < pageCount - 1

    newPage > state.pageIndex && !canNextPage && fetchMore?.()
  }

  const handleResetFilters = () => {
    setGlobalFilter()
    setAllFilters([])
    setSortBy([])
  }

  const cannotFilterByLabel = useMemo(
    () =>
      disableGlobalLabel || !columns.some((col) => col.id === LABEL_COLUMN_ID),
    [disableGlobalLabel]
  )

  const canResetFilter = state.filters?.length > 0 || state.sortBy?.length > 0

  const messageValues = messages.filter(
    (messageValue) => messageValue?.rows?.length
  )
  const MessagesRowsAlerts = () => {
    let grid = 12
    messageValues.length && (grid = grid / messageValues.length)

    return (
      <Grid container spacing={2}>
        {messageValues.map((value, index) => (
          <Grid item xs={grid} key={`messageAlert-${index}`}>
            <Alert icon={value?.icon || ''} severity={value?.type || 'info'}>
              {value?.message || ''}
            </Alert>
          </Grid>
        ))}
      </Grid>
    )
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
          selectedRows={selectedRows}
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
          {!cannotFilterByLabel && (
            <GlobalLabel
              {...useTableProps}
              selectedRows={selectedRows}
              useUpdateMutation={useUpdateMutation}
            />
          )}
          <GlobalFilter {...useTableProps} />
          {!disableGlobalSort && <GlobalSort {...useTableProps} />}
        </div>
        {/* SELECTED ROWS */}
        {displaySelectedRows && (
          <div>
            <GlobalSelectedRows
              useTableProps={useTableProps}
              gotoRowPage={gotoRowPage}
            />
          </div>
        )}
      </div>

      {/* RESET FILTERS */}
      <Chip
        label={<Translate word={T.ResetFilters} />}
        onClick={canResetFilter ? handleResetFilters : undefined}
        icon={<RemoveIcon />}
        sx={{
          visibility: canResetFilter ? 'visible' : 'hidden',
          width: 'fit-content',
          padding: '0.75em',
          marginBottom: '0.5em',
        }}
      />

      <div className={clsx(styles.body, classes.body)}>
        {!!messages.length && <MessagesRowsAlerts />}
        {/* NO DATA MESSAGE */}
        {!isLoading &&
          !isUninitialized &&
          page?.length === 0 &&
          (noDataMessage || (
            <span className={styles.noDataMessage}>
              <InfoEmpty />
              <Translate word={T.NoDataAvailable} />
            </span>
          ))}

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
              {...(messageValues.length && {
                globalErrors: messageValues,
              })}
              className={isSelected ? 'selected' : ''}
              {...(!cannotFilterByLabel && {
                onClickLabel: (label) => {
                  const currentFilter =
                    state.filters
                      ?.filter(({ id }) => id === LABEL_COLUMN_ID)
                      ?.map(({ value }) => value)
                      ?.flat() || []

                  const nextFilter = [...new Set([...currentFilter, label])]
                  setFilter(LABEL_COLUMN_ID, nextFilter)
                },
              })}
              onClick={(e) => {
                typeof onRowClick === 'function' && onRowClick(original)

                if (!disableRowSelect) {
                  if (
                    singleSelect ||
                    (!singleSelect && !(e.ctrlKey || e.metaKey))
                  ) {
                    toggleAllRowsSelected?.(false)
                  }

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
  disableGlobalLabel: PropTypes.bool,
  disableGlobalSort: PropTypes.bool,
  disableRowSelect: PropTypes.bool,
  displaySelectedRows: PropTypes.bool,
  useUpdateMutation: PropTypes.func,
  onSelectedRowsChange: PropTypes.func,
  onRowClick: PropTypes.func,
  pageSize: PropTypes.number,
  RowComponent: PropTypes.any,
  showPageCount: PropTypes.bool,
  singleSelect: PropTypes.bool,
  noDataMessage: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.node,
    PropTypes.bool,
  ]),
  messages: PropTypes.array,
}

export * from 'client/components/Tables/Enhanced/Utils'

export default EnhancedTable
