import * as React from 'react'

import { LinearProgressWithLabel } from 'client/components/Status'
import * as DatastoreModel from 'client/models/Datastore'

export default [
  /* {
    id: 'selection',
    // The header can use the table's getToggleAllRowsSelectedProps method
    // to render a checkbox.
    // Pagination is a problem since this will select all rows even though
    // not all rows are on the current page.
    // The solution should be server side pagination.
    // For one, the clients should not download all rows in most cases.
    // The client should only download data for the current page.
    // In that case, getToggleAllRowsSelectedProps works fine.
    Header: ({ getToggleAllRowsSelectedProps }) => (
      <CheckboxCell {...getToggleAllRowsSelectedProps()} />
    ),
    // The cell can use the individual row's getToggleRowSelectedProps method
    // to the render a checkbox
    Cell: ({ row }) => (
      <CheckboxCell {...row.getToggleRowSelectedProps()} />
    )
  }, */
  {
    Header: '#', accessor: 'ID'
  },
  { Header: 'Name', accessor: 'NAME' },
  {
    Header: 'State',
    id: 'STATE',
    accessor: row => DatastoreModel.getState(row)?.name
  },
  {
    Header: 'Type',
    id: 'TYPE',
    accessor: row => DatastoreModel.getType(row)?.name
  },
  {
    Header: 'Owner/Group',
    accessor: row => `${row.UNAME}/${row.GNAME}`
  },
  { Header: 'Cluster', accessor: 'CLUSTER' },
  {
    Header: 'Allocated CPU',
    accessor: row => {
      const { percentOfUsed, percentLabel } = DatastoreModel.getCapacityInfo(row)

      return (
        <div style={{ paddingRight: '1em' }}>
          <LinearProgressWithLabel value={percentOfUsed} label={percentLabel} />
        </div>
      )
    }
  }
]
