const getTotalOfResources = resources => [resources?.ID ?? []].flat().length || 0

export default [
  { Header: 'ID', accessor: 'ID', sortType: 'number' },
  { Header: 'Name', accessor: 'NAME' },
  { Header: 'Owner', accessor: 'UNAME' },
  { Header: 'Group', accessor: 'GNAME' },
  {
    Header: 'Total VMs',
    id: 'VMS',
    accessor: row => getTotalOfResources(row?.VMS),
    sortType: 'number'
  },
  {
    Header: 'Group',
    id: 'TEMPLATE_ID',
    accessor: row => row?.TEMPLATE?.TEMPLATE_ID
  }
]
