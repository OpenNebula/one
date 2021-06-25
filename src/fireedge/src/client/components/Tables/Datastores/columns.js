import * as DatastoreModel from 'client/models/Datastore'

export default [
  { Header: 'ID', accessor: 'ID', sortType: 'number' },
  { Header: 'Name', accessor: 'NAME' },
  { Header: 'Owner', accessor: 'UNAME' },
  { Header: 'Group', accessor: 'GNAME' },
  {
    Header: 'State',
    id: 'STATE',
    accessor: row => DatastoreModel.getState(row)
  },
  {
    Header: 'Type',
    id: 'TYPE',
    accessor: row => DatastoreModel.getType(row)
  },
  {
    Header: 'Clusters IDs',
    id: 'CLUSTERS',
    accessor: row => [row?.CLUSTERS?.ID ?? []].flat(),
    sortType: 'length'
  },
  {
    Header: 'Allocated CPU',
    accessor: 'ALLOCATED_CPU',
    sortType: 'number'
  },
  {
    Header: 'Total Capacity',
    accessor: 'TOTAL_MB',
    sortType: 'number'
  },
  {
    Header: 'Free Capacity',
    accessor: 'USED_MB',
    sortType: 'number'
  },
  {
    Header: 'Provision ID',
    id: 'PROVISION_ID',
    accessor: 'PROVISION.ID'
  }
]
