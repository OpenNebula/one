import * as ImageModel from 'client/models/Image'

const getTotalOfResources = resources => [resources?.ID ?? []].flat().length || 0

export default [
  { Header: 'ID', accessor: 'ID', sortType: 'number' },
  { Header: 'Name', accessor: 'NAME' },
  { Header: 'Owner', accessor: 'UNAME' },
  { Header: 'Group', accessor: 'GNAME' },
  {
    Header: 'State',
    id: 'STATE',
    accessor: row => ImageModel.getState(row)
  },
  {
    Header: 'Type',
    id: 'TYPE',
    accessor: row => ImageModel.getType(row)
  },
  {
    Header: 'Disk Type',
    id: 'DISK_TYPE',
    accessor: row => ImageModel.getDiskType(row)
  },
  { Header: 'Registration Time', accessor: 'REGTIME' },
  { Header: 'Datastore', accessor: 'DATASTORE' },
  { Header: 'Persistent', accessor: 'PERSISTENT' },
  {
    Header: 'Running VMs',
    accessor: 'RUNNING_VMS',
    sortType: 'number'
  },
  {
    Header: 'Total VMs',
    id: 'TOTAL_VMS',
    accessor: row => getTotalOfResources(row?.VMS),
    sortType: 'number'
  }
]
