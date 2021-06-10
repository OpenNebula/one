/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-key */
import * as React from 'react'

import { Paper, debounce, LinearProgress, CircularProgress } from '@material-ui/core'
import { useVirtual } from 'react-virtual'
import {
  useTable,
  useGlobalFilter,
  useSortBy,
  useRowSelect,
  useFilters,
  usePagination,
  useFlexLayout
} from 'react-table'

import { useNearScreen } from 'client/hooks'
import { EnhancedTable, DefaultFilter } from 'client/components/Table'

import Columns from 'client/components/Tables/VmTable/columns'
import { console } from 'window-or-global'

const VmTable = ({ data, isLoading, finish, getNextData }) => {
  const parentRef = React.useRef()

  // <----------- USE TABLE ----------->
  const columns = React.useMemo(() => Columns, [])

  const defaultColumn = React.useMemo(() => ({
    Filter: DefaultFilter
  }), [])

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    totalColumnsWidth,
    prepareRow
  } = useTable(
    {
      columns,
      data,
      defaultColumn
    },
    useRowSelect,
    useFlexLayout
  )
  // <----------- FINISH USE TABLE ----------->

  // <----------- VIRTUALIZER ----------->
  const rowVirtualizer = useVirtual({
    size: rows.length,
    parentRef,
    overscan: 10,
    estimateSize: React.useCallback(() => 50, []),
    keyExtractor: index => rows[index]?.id
  })
  // <----------- FINISH VIRTUALIZER ----------->

  // <----------- OBSERVER ----------->
  const loaderRef = React.useRef()
  const { isNearScreen } = useNearScreen({
    distance: '100px',
    externalRef: isLoading ? null : loaderRef,
    once: false
  })

  const debounceHandleNextPage = React.useCallback(debounce(getNextData, 200), [])

  React.useEffect(() => {
    if (isNearScreen && !finish) debounceHandleNextPage()
  }, [isNearScreen, finish, debounceHandleNextPage])
  // <----------- FINISH OBSERVER ----------->

  const RenderRow = React.useCallback(({ row, virtualRow }) => (
    <div
      {...row.getRowProps()}
      ref={virtualRow.measureRef}
      style={{
        display: 'flex',
        alignItems: 'center',
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: `${virtualRow.size}px`,
        transform: `translateY(${virtualRow.start}px)`
      }}
    >
      {row.cells.map(cell => (
        <div {...cell.getCellProps()}>
          {cell.render('Cell')}
        </div>
      ))}
    </div>
  ), [prepareRow, rows])

  return (
    <Paper style={{ height: '100%', overflow: 'hidden' }}>
      <div
        {...getTableProps()}
        style={{ height: '100%', display: 'flex', flexFlow: 'column' }}
      >
        <div>
          {headerGroups.map(headerGroup => (
            <div {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map(column => (
                <div {...column.getHeaderProps()}>
                  {column.render('Header')}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div ref={parentRef} style={{ height: '100%', overflow: 'auto' }}>
          <div
            {...getTableBodyProps()}
            style={{
              height: `${rowVirtualizer.totalSize}px`,
              width: '100%',
              position: 'relative'
            }}
          >
            {rowVirtualizer.virtualItems?.map(virtualRow => {
              const row = rows[virtualRow.index]
              prepareRow(row)

              return <RenderRow
                key={row.getRowProps().key}
                row={row}
                virtualRow={virtualRow}
              />
            })}
          </div>

          {!finish && (
            <LinearProgress
              ref={loaderRef}
              color='secondary'
              style={{ width: '100%', marginTop: 10 }}
            />
          )}
        </div>

        <p style={{ display: 'flex', alignItems: 'center', gap: '1em' }}>
          <span>Total loaded: {rows.length}</span>
          {isLoading && <CircularProgress size='1em' />}
        </p>
      </div>

    </Paper>
  )
}

export default VmTable
