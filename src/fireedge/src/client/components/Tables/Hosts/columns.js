export default [
  { Header: 'ID', accessor: 'ID' },
  { Header: 'Name', id: 'NAME', accessor: row => row?.TEMPLATE?.NAME ?? row.NAME },
  { Header: 'State', accessor: 'STATE' },
  { Header: 'Cluster', accessor: 'CLUSTER' },
  { Header: 'IM MAD', accessor: 'IM_MAD' },
  { Header: 'VM MAD', accessor: 'VM_MAD' },
  { Header: 'Running VMs', accessor: 'HOST_SHARE.RUNNING_VMS' },
  { Header: 'CPU Usage', accessor: 'CPU_USAGE' },
  { Header: 'CPU Total', accessor: 'TOTAL_CPU' },
  { Header: 'MEM Usage', accessor: 'MEM_USAGE' },
  { Header: 'MEM Total', accessor: 'TOTAL_MEM' }
]
