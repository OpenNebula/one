/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import { memo, useEffect, useMemo, useState } from 'react'

import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  useTheme,
} from '@mui/material'
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
} from 'opennebula-react-table'

import {
  ChangeViewTable,
  GlobalActions,
  GlobalFilter,
  GlobalLabel,
  GlobalSearch,
  GlobalSelectedRows,
  GlobalSort,
  SwitchTableView,
  LABEL_COLUMN_ID,
} from '@modules/components/Tables/Enhanced/Utils'
import Pagination from '@modules/components/Tables/Enhanced/pagination'
import EnhancedTableStyles from '@modules/components/Tables/Enhanced/styles'

import { T } from '@ConstantsModule'
import { useAuth } from '@FeaturesModule'
import { Translate } from '@modules/components/HOC'
import _ from 'lodash'

const RELOAD_STATE = 'RELOAD_STATE'

const DataListPerPage = memo(
  ({
    page = [],
    prepareRow,
    RowComponent,
    headerList,
    messageValues,
    setFilter,
    state,
    disableRowSelect,
    onRowClick,
    readOnly,
    singleSelect,
    toggleAllRowsSelected,
    zoneId,
    cannotFilterByLabel,
    styles,
    rootProps: rootPropsTable,
    enabledFullScreen = false,
    gotoPage,
  }) => {
    if (!page.length) {
      return ''
    }

    const valuesPerPages = page.map((row) => {
      prepareRow(row)
      /** @type {UseRowSelectRowProps} */
      const { getRowProps, original, values, toggleRowSelected, isSelected } =
        row
      const { key, ...rowProps } = getRowProps()

      return (
        <RowComponent
          {...rowProps}
          headerList={headerList}
          zone={zoneId}
          key={key}
          original={original}
          value={values}
          singleSelect={singleSelect}
          {...(messageValues.length && {
            globalErrors: messageValues,
          })}
          isSelected={isSelected}
          toggleRowSelected={toggleRowSelected}
          rowDataCy={rootPropsTable?.['data-cy'] ?? ''}
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
              gotoPage(0)
            },
          })}
          onClick={(e) => {
            typeof onRowClick === 'function' && onRowClick(original)
            if (!disableRowSelect && !readOnly) {
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
    })

    return headerList ? (
      <Table stickyHeader className={styles.table} size="small">
        <TableHead>
          <TableRow>
            {!singleSelect && <TableCell className={styles.cellHeaders} />}
            {headerList.map(({ header = '', id = '' }) => (
              <TableCell key={id} className={styles.cellHeaders}>
                {header}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>{valuesPerPages}</TableBody>
      </Table>
    ) : (
      <>{valuesPerPages}</>
    )
  }
)

DataListPerPage.propTypes = {
  page: PropTypes.any,
  prepareRow: PropTypes.func,
  RowComponent: PropTypes.any,
  headerList: PropTypes.oneOfType([PropTypes.array, PropTypes.bool]),
  enabledFullScreen: PropTypes.bool,
  messageValues: PropTypes.array,
  setFilter: PropTypes.func,
  state: PropTypes.any,
  disableRowSelect: PropTypes.bool,
  onRowClick: PropTypes.func,
  readOnly: PropTypes.bool,
  singleSelect: PropTypes.bool,
  toggleAllRowsSelected: PropTypes.func,
  zoneId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  cannotFilterByLabel: PropTypes.any,
  styles: PropTypes.any,
  rootProps: PropTypes.shape({
    'data-cy': PropTypes.string,
  }),
  gotoPage: PropTypes.func,
}

DataListPerPage.displayName = 'DataListPerPage'

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
  disableGlobalActions = false,
  disableSwitchView = false,
  onSelectedRowsChange,
  pageSize,
  onRowClick,
  RowComponent,
  showPageCount,
  singleSelect = false,
  classes = {},
  rootProps = {},
  searchProps = {},
  noDataMessage,
  noDataCustomRenderer,
  messages = [],
  dataDepend,
  readOnly = false,
  tableViews,
  zoneId,
  headerList,
  enabledFullScreen,
  resourceType,
}) => {
  const { settings: { FIREEDGE: fireedge = {} } = {} } = useAuth()
  const { ROW_SIZE = 10 } = fireedge

  const defaultPageSize = pageSize || Number(ROW_SIZE)
  const theme = useTheme()
  const styles = useMemo(
    () =>
      EnhancedTableStyles({
        ...theme,
        disableGlobalSort,
        disableGlobalActions,
        readOnly: readOnly,
      }),
    [theme]
  )

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
  const stateReducer = (newState, action, prevState) => {
    switch (action.type) {
      case RELOAD_STATE: {
        const updatedState = {
          ...prevState,
          selectedRowIds: action.value,
        }

        return updatedState
      }
      case 'toggleAllRowsSelected': {
        // If the action is to deselect all the rows, the selectRowIds has to be an empory objet
        if (singleSelect && !action.value) {
          newState.selectedRowIds = {}
        }

        return newState
      }
      default:
        return newState
    }
  }

  const inclusiveArrayMatch = (tRows, id, fv) =>
    tRows.filter((row) => {
      const rowVal = row.values[id]

      return Array.isArray(rowVal) && fv.some((val) => rowVal.includes(val))
    })

  const useTableProps = useTable(
    {
      columns,
      data,
      defaultColumn,
      globalFilter,
      sortTypes,
      getRowId,
      filterTypes: {
        inclusiveArrayMatch,
      },
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
      initialState: { pageSize: defaultPageSize, ...initialState },
      stateReducer,
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
    toggleRowSelected: propsToggleRow,
    dispatch,
  } = useTableProps

  const [stateData, setStateData] = useState(data)
  const [filterValue, setFilterValue] = useState(state.globalFilter)

  useEffect(() => {
    gotoPage(0)
  }, [state.filters, state.globalFilter])

  const gotoRowPage = async (row) => {
    const pageIdx = Math.floor(row.index / defaultPageSize)

    await gotoPage(pageIdx)

    // scroll to the row in the table view (if it's visible)
    document
      ?.querySelector(`.selected[role='row'][data-cy$='-${row.id}']`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  // opennebula-react-table bug => https://github.com/TanStack/table/issues/5176
  // This safely deselects rows
  const safeToggleRowSelected =
    (row) =>
    (rowSelected = false) => {
      if (typeof row?.id !== 'undefined') {
        if (state?.globalFilter !== '') {
          setFilterValue(undefined)
          setGlobalFilter(undefined)
        }

        propsToggleRow(row?.id, rowSelected)
      }
    }

  const selectedRowStates = useMemo(
    () =>
      data
        ?.filter((row) => state?.selectedRowIds?.[row?.ID])
        ?.map((selected) => selected?.STATE),
    [data]
  )

  const selectedRows = useMemo(() => {
    const selectedIds = Object.keys(state.selectedRowIds ?? {})

    return selectedIds
      .map((id) => preGlobalFilteredRowsById[id])
      .filter(Boolean)
      .map((row) => ({
        ...row,
        toggleRowSelected: safeToggleRowSelected(row),
      }))
  }, [state.selectedRowIds, selectedRowStates])

  useEffect(() => {
    initialState?.selectedRowIds &&
      !_.isEqual(state.selectedRowIds, initialState.selectedRowIds) &&
      dispatch({
        type: RELOAD_STATE,
        value: initialState.selectedRowIds,
      })
  }, [initialState?.selectedRowIds])

  useEffect(() => {
    if (
      dataDepend &&
      page.length &&
      initialState?.selectedRowIds &&
      JSON.stringify(data) !== JSON.stringify(stateData)
    ) {
      const initialKeys = Object.keys(initialState.selectedRowIds)
      page.forEach((row) => {
        if (!initialKeys.includes(row?.id) && row?.isSelected) {
          propsToggleRow(row?.id, false)
        } else if (row?.isSelected) {
          propsToggleRow(row?.id, false)
        }
      })
      setStateData(data)
    }
  }, [dataDepend])

  useMountedLayoutEffect(() => {
    onSelectedRowsChange?.(
      selectedRows.map((row) => ({ ...row, gotoPage: () => gotoRowPage(row) }))
    )
  }, [state.selectedRowIds])

  const handleChangePage = (newPage) => {
    gotoPage(newPage)

    const canNextPage =
      pageCount === -1
        ? page.length >= defaultPageSize
        : newPage < pageCount - 1

    newPage > state.pageIndex && !canNextPage && fetchMore?.()
  }

  const handleResetFilters = () => {
    setGlobalFilter()
    setAllFilters([])
    setSortBy([])
    gotoPage(0)
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
      {/* Toolbar has four rows */}
      <div className={styles.toolbar}>
        {/* First row - Global actions (refresh, select) + Resource actions (create, update,...) */}
        <div className={styles.toolbarContainer}>
          <GlobalActions
            className={styles.actions}
            refetch={refetch}
            isLoading={isLoading}
            singleSelect={singleSelect}
            disableRowSelect={disableRowSelect || readOnly}
            globalActions={globalActions}
            selectedRows={selectedRows}
            onSelectedRowsChange={onSelectedRowsChange}
            useTableProps={useTableProps}
            styles={styles}
          />

          {!disableSwitchView && <SwitchTableView />}
        </div>

        {/* Second row - Left: Search bar, Right: Labels, Filters and Sort */}
        <div className={styles.toolbarContainer}>
          <GlobalSearch
            useTableProps={useTableProps}
            searchProps={searchProps}
            value={filterValue}
            setValue={setFilterValue}
            sx={{ flex: 1 }}
          />
          <div className={styles.filters}>
            {!cannotFilterByLabel && (
              <GlobalLabel
                {...useTableProps}
                selectedRows={selectedRows}
                useUpdateMutation={useUpdateMutation}
                type={resourceType}
                filters={state.filters}
                setFilter={setFilter}
                resetFilter={handleResetFilters}
              />
            )}
            <GlobalFilter {...useTableProps} />
            {!disableGlobalSort && <GlobalSort {...useTableProps} />}
            {tableViews && <ChangeViewTable tableViews={tableViews} />}
          </div>
        </div>

        {/* Third row - Selected rows (IMPORTANT: Only render if displaySelectedRows is true) */}
        {displaySelectedRows && !readOnly && (
          <div>
            <GlobalSelectedRows
              useTableProps={useTableProps}
              gotoRowPage={gotoRowPage}
            />
          </div>
        )}

        {/* Fourth row - Pagination and clear filters */}
        <div className={styles.toolbarContainer}>
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
          <Pagination
            handleChangePage={handleChangePage}
            useTableProps={useTableProps}
            count={rows.length}
            showPageCount={showPageCount}
            styles={styles}
          />
        </div>
      </div>

      <div className={clsx(styles.body, !headerList ? classes.body : '')}>
        {!!messages.length && <MessagesRowsAlerts />}
        {/* NO DATA MESSAGE */}
        {isLoading && !refetch ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100%"
          >
            <CircularProgress />
          </Box>
        ) : (
          !isLoading &&
          !isUninitialized &&
          page?.length === 0 &&
          (noDataCustomRenderer || noDataMessage || (
            <span className={styles.noDataMessage}>
              <InfoEmpty />
              <Translate word={T.NoDataAvailable} />
            </span>
          ))
        )}

        {/* DATALIST PER PAGE */}
        <DataListPerPage
          rootProps={rootProps}
          page={page}
          prepareRow={prepareRow}
          RowComponent={RowComponent}
          headerList={headerList}
          enabledFullScreen={enabledFullScreen}
          messageValues={messageValues}
          setFilter={setFilter}
          state={state}
          disableRowSelect={disableRowSelect}
          onRowClick={onRowClick}
          readOnly={readOnly}
          singleSelect={singleSelect}
          toggleAllRowsSelected={toggleAllRowsSelected}
          zoneId={zoneId}
          cannotFilterByLabel={cannotFilterByLabel}
          styles={styles}
          gotoPage={gotoPage}
        />
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
  disableGlobalActions: PropTypes.bool,
  disableSwitchView: PropTypes.bool,
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
  noDataCustomRenderer: PropTypes.object,
  messages: PropTypes.array,
  dataDepend: PropTypes.oneOfType([PropTypes.array, PropTypes.string]),
  readOnly: PropTypes.bool,
  tableViews: PropTypes.object,
  zoneId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  headerList: PropTypes.oneOfType([PropTypes.array, PropTypes.bool]),
  enabledFullScreen: PropTypes.bool,
  resourceType: PropTypes.string,
}

export * from '@modules/components/Tables/Enhanced/Utils'

export default EnhancedTable
