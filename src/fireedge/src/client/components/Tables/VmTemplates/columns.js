import CategoryFilter from 'client/components/Tables/Enhanced/Utils/CategoryFilter'
import * as Helper from 'client/models/Helper'

export default [
  { Header: 'ID', accessor: 'ID', sortType: 'number' },
  { Header: 'Name', accessor: 'NAME' },
  { Header: 'Owner', accessor: 'UNAME' },
  { Header: 'Group', accessor: 'GNAME' },
  { Header: 'Start Time', accessor: 'REGTIME' },
  { Header: 'Locked', accessor: 'LOCK' },
  {
    Header: 'Virtual Router',
    id: 'VROUTER',
    accessor: row =>
      Helper.stringToBoolean(row?.TEMPLATE?.VROUTER) && 'VROUTER',
    disableFilters: false,
    Filter: ({ column }) => CategoryFilter({
      column,
      title: 'Virtual Router'
    }),
    filter: 'exact'
  }
]
