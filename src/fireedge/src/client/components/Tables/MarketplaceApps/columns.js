import * as MarketplaceAppModel from 'client/models/MarketplaceApp'

export default [
  { Header: 'ID', accessor: 'ID', sortType: 'number' },
  { Header: 'Name', accessor: 'NAME' },
  { Header: 'Owner', accessor: 'UNAME' },
  { Header: 'Group', accessor: 'GNAME' },
  {
    Header: 'State',
    id: 'STATE',
    accessor: row => MarketplaceAppModel.getState(row)
  },
  {
    Header: 'Type',
    id: 'TYPE',
    accessor: row => MarketplaceAppModel.getType(row)
  },
  { Header: 'Size', accessor: 'SIZE' },
  { Header: 'Registration Time', accessor: 'REGTIME' },
  { Header: 'Marketplace', accessor: 'MARKETPLACE' },
  { Header: 'Zone ID', accessor: 'ZONE_ID' }
]
