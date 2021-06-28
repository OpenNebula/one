import CategoryFilter from 'client/components/Tables/Enhanced/Utils/CategoryFilter'
import * as HostModel from 'client/models/Host'

const getTotalOfResources = resources => [resources?.ID ?? []].flat().length || 0

export default [
  { Header: 'ID', accessor: 'ID', sortType: 'number' },
  {
    Header: 'Name',
    id: 'NAME',
    accessor: row => row?.TEMPLATE?.NAME ?? row.NAME
  },
  {
    Header: 'State',
    id: 'STATE',
    accessor: row => HostModel.getState(row)?.name,
    disableFilters: false,
    Filter: ({ column }) => CategoryFilter({
      column,
      multiple: true,
      title: 'State'
    }),
    filter: 'includesValue'
  },
  { Header: 'Cluster', accessor: 'CLUSTER' },
  {
    Header: 'IM MAD',
    accessor: 'IM_MAD',
    disableFilters: false,
    Filter: ({ column }) => CategoryFilter({
      column,
      multiple: true,
      title: 'IM Mad'
    }),
    filter: 'includesValue'
  },
  {
    Header: 'VM MAD',
    accessor: 'VM_MAD',
    disableFilters: false,
    Filter: ({ column }) => CategoryFilter({
      column,
      multiple: true,
      title: 'VM Mad'
    }),
    filter: 'includesValue'
  },
  {
    Header: 'Running VMs',
    id: 'RUNNING_VMS',
    accessor: 'HOST_SHARE.RUNNING_VMS',
    sortType: 'number'
  },
  {
    Header: 'Total VMs',
    id: 'TOTAL_VMS',
    accessor: row => getTotalOfResources(row?.VMS),
    sortType: 'number'
  },
  {
    Header: 'Host Share',
    accessor: 'HOST_SHARE',
    disableSortBy: true
  }
]
