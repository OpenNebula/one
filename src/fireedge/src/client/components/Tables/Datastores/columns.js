import * as React from 'react'

import { LinearProgressWithLabel, StatusBadge } from 'client/components/Status'
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
    Header: '',
    id: 'STATE',
    width: 50,
    accessor: row => {
      const state = DatastoreModel.getState(row)

      return (
        <StatusBadge
          title={state?.name}
          stateColor={state?.color}
          customTransform='translate(150%, 50%)'
        />
      )
    }
  },
  { Header: '#', accessor: 'ID', width: 45 },
  { Header: 'Name', accessor: 'NAME' },
  {
    Header: 'Type',
    id: 'TYPE',
    width: 100,
    accessor: row => DatastoreModel.getType(row)?.name
  },
  {
    Header: 'Owner/Group',
    accessor: row => `${row.UNAME}/${row.GNAME}`
  },
  {
    Header: 'Clusters',
    id: 'CLUSTERS',
    width: 100,
    accessor: row => [row.CLUSTERS?.ID ?? []].flat().join(',')
  },
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
