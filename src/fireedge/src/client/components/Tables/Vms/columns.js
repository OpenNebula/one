import * as VirtualMachineModel from 'client/models/VirtualMachine'

export default [
  { Header: 'ID', accessor: 'ID', sortType: 'number' },
  { Header: 'Name', accessor: 'NAME' },
  {
    Header: 'State',
    id: 'STATE',
    accessor: row => VirtualMachineModel.getState(row)
  },
  { Header: 'Owner', accessor: 'UNAME' },
  { Header: 'Group', accessor: 'GNAME' },
  { Header: 'Start Time', accessor: 'STIME' },
  { Header: 'End Time', accessor: 'ETIME' },
  { Header: 'Locked', accessor: 'LOCK' },
  {
    Header: 'Ips',
    id: 'IPS',
    accessor: row => VirtualMachineModel.getIps(row).join(','),
    sortType: 'length'
  },
  {
    Header: 'Hostname',
    id: 'HOSTNAME',
    accessor: row => VirtualMachineModel.getLastHistory(row)?.HOSTNAME ?? '--'
  }
]
