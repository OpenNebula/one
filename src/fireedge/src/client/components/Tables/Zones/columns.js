import CategoryFilter from 'client/components/Tables/Enhanced/Utils/CategoryFilter'
import * as ZoneModel from 'client/models/Zone'

export default [
  { Header: 'ID', accessor: 'ID', sortType: 'number' },
  { Header: 'Name', accessor: 'NAME' },
  {
    Header: 'State',
    id: 'STATE',
    accessor: row => ZoneModel.getState(row)?.name,
    disableFilters: false,
    Filter: ({ column }) => CategoryFilter({
      column,
      multiple: true,
      title: 'State'
    }),
    filter: 'includesValue'
  },
  {
    Header: 'ENDPOINT',
    id: 'ENDPOINT',
    accessor: row => row?.TEMPLATE?.ENDPOINT,
    disableSortBy: true
  }

]
