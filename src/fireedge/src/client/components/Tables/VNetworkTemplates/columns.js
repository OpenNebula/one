export default [
  { Header: 'ID', accessor: 'ID', sortType: 'number' },
  { Header: 'Name', accessor: 'NAME' },
  { Header: 'Owner', accessor: 'UNAME' },
  { Header: 'Group', accessor: 'GNAME' },
  { Header: 'Locked', accessor: 'LOCK' },
  { Header: 'Registration Time', accessor: 'REGTIME' },
  {
    Header: 'Provision ID',
    id: 'PROVISION_ID',
    accessor: row => row?.TEMPLATE?.PROVISION?.ID,
    disableSortBy: true
  }

]
