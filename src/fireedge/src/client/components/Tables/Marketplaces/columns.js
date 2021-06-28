import CategoryFilter from 'client/components/Tables/Enhanced/Utils/CategoryFilter'
import * as MarketplaceModel from 'client/models/Datastore'

const getTotalOfResources = resources => [resources?.ID ?? []].flat().length || 0

export default [
  { Header: 'ID', accessor: 'ID', sortType: 'number' },
  { Header: 'Name', accessor: 'NAME' },
  { Header: 'Owner', accessor: 'UNAME' },
  { Header: 'Group', accessor: 'GNAME' },
  {
    Header: 'State',
    id: 'STATE',
    accessor: row => MarketplaceModel.getState(row)?.name,
    disableFilters: false,
    Filter: ({ column }) => CategoryFilter({
      column,
      multiple: true,
      title: 'State'
    }),
    filter: 'includesValue'
  },
  { Header: 'Market', accessor: 'MARKET_MAD' },
  { Header: 'Total Capacity', accessor: 'TOTAL_MB' },
  { Header: 'Free Capacity', accessor: 'USED_MB' },
  { Header: 'Zone ID', accessor: 'ZONE_ID' },
  {
    Header: 'Total Apps',
    id: 'TOTAL_APPS',
    accessor: row => getTotalOfResources(row?.MARKETPLACEAPPS)
  }
]
