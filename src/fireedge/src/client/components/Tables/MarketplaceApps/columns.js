import CategoryFilter from 'client/components/Tables/Enhanced/Utils/CategoryFilter'
import * as MarketplaceAppModel from 'client/models/MarketplaceApp'

export default [
  { Header: 'ID', accessor: 'ID', sortType: 'number' },
  { Header: 'Name', accessor: 'NAME' },
  { Header: 'Owner', accessor: 'UNAME' },
  { Header: 'Group', accessor: 'GNAME' },
  {
    Header: 'State',
    id: 'STATE',
    accessor: row => MarketplaceAppModel.getState(row)?.name,
    disableFilters: false,
    Filter: ({ column }) => CategoryFilter({
      column,
      multiple: true,
      title: 'State'
    }),
    filter: 'includesValue'
  },
  {
    Header: 'Type',
    id: 'TYPE',
    accessor: row => MarketplaceAppModel.getType(row)
  },
  { Header: 'Size', accessor: 'SIZE' },
  { Header: 'Registration Time', accessor: 'REGTIME' },
  {
    Header: 'Marketplace',
    accessor: 'MARKETPLACE',
    disableFilters: false,
    Filter: ({ column }) => CategoryFilter({
      column,
      multiple: true,
      title: 'Marketplace'
    }),
    filter: 'includesValue'
  },
  { Header: 'Zone ID', accessor: 'ZONE_ID' }
]
