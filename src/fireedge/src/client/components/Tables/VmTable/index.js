/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-key */
import * as React from 'react'

import { Box, CircularProgress } from '@material-ui/core'
import {
  useTable,
  useGlobalFilter,
  useRowSelect,
  useFlexLayout
} from 'react-table'

import { ListVirtualized } from 'client/components/List'
import Toolbar from 'client/components/Tables/VmTable/toolbar'
import Header from 'client/components/Tables/VmTable/header'
import Row from 'client/components/Tables/VmTable/row'
import Columns from 'client/components/Tables/VmTable/columns'

const VmTable = ({ data, isLoading, canFetchMore, fetchMore }) => {
  const columns = React.useMemo(() => Columns, [])

  const defaultColumn = React.useMemo(() => ({
    // Filter: DefaultFilter,
    Cell: React.memo(({ value }) => value ?? '--')
  }), [])

  const useTableProps = useTable(
    { columns, data, defaultColumn },
    useRowSelect,
    useFlexLayout,
    useGlobalFilter
  )

  const { getTableProps, getTableBodyProps, rows } = useTableProps

  return (
    <Box {...getTableProps()}
      height={1}
      display='flex'
      flexDirection='column'
      border='1px solid #d7dde3'
      borderRadius={5}
    >
      <Toolbar useTableProps={useTableProps} />
      <Header useTableProps={useTableProps} />

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

      <div
        style={{
          padding: '1em',
          display: 'flex',
          alignItems: 'center',
          gap: '1em',
          color: '#4a5568',
          backgroundColor: '#e6e8f7',
          borderBlock: '0.5px solid #eef2f7'
        }}
      >
        <span>Total loaded: {useTableProps.rows.length}</span>
        {isLoading && <CircularProgress size='1em' />}
      </div>
    </Box>
  )
}

export default VmTable
