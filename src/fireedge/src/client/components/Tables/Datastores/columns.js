const getNumberOfResources = resources => [resources?.ID ?? []].flat().length || 0

export default [
  { Header: 'ID', accessor: 'ID' },
  { Header: 'Name', accessor: 'NAME' },
  { Header: 'Owner', accessor: 'UNAME' },
  { Header: 'Group', accessor: 'GNAME' },
  { Header: 'State', accessor: 'STATE' },
  { Header: 'Type', accessor: 'TYPE' },
  {
    Header: 'Number of Clusters',
    id: 'CLUSTERS',
    accessor: row => getNumberOfResources(row?.CLUSTERS)
  },
  { Header: 'Allocated CPU', accessor: 'ALLOCATED_CPU' }
]
