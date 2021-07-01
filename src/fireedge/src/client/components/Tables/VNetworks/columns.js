import * as VirtualNetworkModel from 'client/models/VirtualNetwork'

const getTotalOfResources = resources => [resources?.ID ?? []].flat().length || 0

export default [
  { Header: 'ID', accessor: 'ID', sortType: 'number' },
  { Header: 'Name', accessor: 'NAME' },
  { Header: 'Owner', accessor: 'UNAME' },
  { Header: 'Group', accessor: 'GNAME' },
  { Header: 'Locked', accessor: 'LOCK' },
  {
    Header: 'Total Clusters',
    id: 'CLUSTERS',
    accessor: row => getTotalOfResources(row?.CLUSTERS),
    sortType: 'number'
  },
  { Header: 'Used Leases', accessor: 'USED_LEASES', sortType: 'number' },
  {
    Header: 'Total Leases',
    id: 'TOTAL_LEASES',
    accessor: row => VirtualNetworkModel.getTotalLeases(row),
    sortType: 'number'
  }

]
