const getTotalOfResources = resources => [resources?.ID ?? []].flat().length || 0

export default [
  { Header: 'ID', accessor: 'ID', sortType: 'number' },
  { Header: 'Name', accessor: 'NAME' },
  {
    Header: 'Total Hosts',
    id: 'HOSTS',
    accessor: row => getTotalOfResources(row?.HOSTS),
    sortType: 'number'
  },
  {
    Header: 'Total Datastores',
    id: 'DATASTORES',
    accessor: row => getTotalOfResources(row?.DATASTORES),
    sortType: 'number'
  },
  {
    Header: 'Total VNets',
    id: 'VNETS',
    accessor: row => getTotalOfResources(row?.VNETS),
    sortType: 'number'
  },
  {
    Header: 'Provider',
    id: 'PROVIDER_NAME',
    accessor: row => row?.TEMPLATE?.PROVISION?.PROVIDER_NAME
  }
]
