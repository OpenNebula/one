const getNumberOfResources = resources => [resources?.ID ?? []].flat().length || 0

export default [
  { Header: 'ID', accessor: 'ID' },
  { Header: 'Name', accessor: 'NAME' },
  { Header: 'Owner', accessor: 'UNAME' },
  { Header: 'Group', accessor: 'GNAME' },
  { Header: 'Market', accessor: 'MARKET_MAD' },
  { Header: 'Zone ID', accessor: 'ZONE_ID' },
  {
    Header: 'Number of Apps',
    id: 'MARKETPLACEAPPS',
    accessor: row => getNumberOfResources(row?.MARKETPLACEAPPS)
  }
]
