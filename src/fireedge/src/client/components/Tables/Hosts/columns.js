import * as React from 'react'

import { LinearProgressWithLabel } from 'client/components/Status'
import * as HostModel from 'client/models/Host'

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
    accessor: row => HostModel.getState(row)?.name
  },
  {
    Header: 'IM/VM',
    accessor: ({ IM_MAD, VM_MAD }) =>
      IM_MAD === VM_MAD ? IM_MAD : `${IM_MAD}/${VM_MAD}`
  },
  { Header: 'Cluster', accessor: 'CLUSTER' },
  { Header: 'RVMs', accessor: 'HOST_SHARE.RUNNING_VMS' },
  {
    Header: 'Allocated CPU',
    accessor: row => {
      const { percentCpuUsed, percentCpuLabel } = HostModel.getAllocatedInfo(row)

      return (
        <div style={{ paddingRight: '1em' }}>
          <LinearProgressWithLabel value={percentCpuUsed} label={percentCpuLabel} />
        </div>
      )
    }
  },
  {
    Header: 'Allocated MEM',
    accessor: row => {
      const { percentMemUsed, percentMemLabel } = HostModel.getAllocatedInfo(row)

      return (
        <div style={{ paddingRight: '1em' }}>
          <LinearProgressWithLabel value={percentMemUsed} label={percentMemLabel} />
        </div>
      )
    }
  }
]
