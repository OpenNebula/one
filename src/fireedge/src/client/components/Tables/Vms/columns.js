import * as VirtualMachineModel from 'client/models/VirtualMachine'

export default [
  { Header: 'ID', accessor: 'ID' },
  { Header: 'Name', accessor: 'NAME' },
  { Header: 'State', accessor: 'STATE' },
  { Header: 'LCM State', accessor: 'LCM_STATE' },
  { Header: 'Owner', accessor: 'UNAME' },
  { Header: 'Group', accessor: 'GNAME' },
  { Header: 'Start Time', accessor: 'STIME' },
  { Header: 'End Time', accessor: 'ETIME' },
  {
    Header: 'Ips',
    id: 'IPS',
    accessor: row => VirtualMachineModel.getIps(row).join(',')
  },
  {
    Header: 'Hostname',
    id: 'HOSTNAME',
    accessor: row => VirtualMachineModel.getLastHistory(row)?.HOSTNAME
  }
]
