const getNumberOfResources = resources => [resources?.ID ?? []].flat().length || 0

export default [
  { Header: 'ID', accessor: 'ID' },
  { Header: 'Name', accessor: 'NAME' },
  {
    Header: 'Number of Hosts',
    id: 'HOSTS',
    accessor: row => getNumberOfResources(row?.HOSTS)
  },
  {
    Header: 'Number of Datastores',
    id: 'DATASTORES',
    accessor: row => getNumberOfResources(row?.DATASTORES)
  },
  {
    Header: 'Number of VNets',
    id: 'VNETS',
    accessor: row => getNumberOfResources(row?.VNETS)
  }
]
