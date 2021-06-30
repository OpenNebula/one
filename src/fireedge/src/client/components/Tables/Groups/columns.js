const getTotalOfResources = resources => [resources?.ID ?? []].flat().length || 0

export default [
  { Header: 'ID', accessor: 'ID', sortType: 'number' },
  { Header: 'Name', accessor: 'NAME' },
  {
    Header: 'Total Users',
    id: 'TOTAL_USERS',
    accessor: row => getTotalOfResources(row?.USERS),
    sortType: 'number'
  }
]
