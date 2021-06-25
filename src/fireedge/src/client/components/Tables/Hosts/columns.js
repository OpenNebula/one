import * as HostModel from 'client/models/Host'

const getTotalOfResources = resources => [resources?.ID ?? []].flat().length || 0

export default [
  { Header: 'ID', accessor: 'ID', sortType: 'number' },
  {
    Header: 'Name',
    id: 'NAME',
    accessor: row => row?.TEMPLATE?.NAME ?? row.NAME
  },
  {
    Header: 'State',
    id: 'STATE',
    accessor: row => HostModel.getState(row)
  },
  { Header: 'Cluster', accessor: 'CLUSTER' },
  { Header: 'IM MAD', accessor: 'IM_MAD' },
  { Header: 'VM MAD', accessor: 'VM_MAD' },
  {
    Header: 'Running VMs',
    id: 'RUNNING_VMS',
    accessor: 'HOST_SHARE.RUNNING_VMS',
    sortType: 'number'
  },
  {
    Header: 'Total VMs',
    id: 'TOTAL_VMS',
    accessor: row => getTotalOfResources(row?.VMS),
    sortType: 'number'
  },
  {
    Header: 'Host Share',
    accessor: 'HOST_SHARE',
    disableSortBy: true
  }
]
