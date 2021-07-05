import * as React from 'react'

import * as VirtualMachine from 'client/models/VirtualMachine'
import { prettyBytes } from 'client/utils'

const VmCapacityTab = data => {
  const { TEMPLATE } = data

  const isVCenter = VirtualMachine.isVCenter(data)

  return (
    <div>
      <p>Physical CPU: {TEMPLATE?.CPU}</p>
      <p>Virtual CPU: {TEMPLATE?.VCPU ?? '-'}</p>
      {isVCenter && (
        <p>Virtual Cores: {`
        Cores x ${TEMPLATE?.TOPOLOGY?.CORES || '-'} |
        Sockets ${TEMPLATE?.TOPOLOGY?.SOCKETS || '-'}
      `}</p>
      )}
      <p>Memory: {prettyBytes(+TEMPLATE?.MEMORY, 'MB')}</p>
      <p>Cost / CPU: {TEMPLATE?.CPU_COST}</p>
      <p>Cost / MByte: {TEMPLATE?.MEMORY_COST}</p>
    </div>
  )
}

VmCapacityTab.displayName = 'VmCapacityTab'

export default VmCapacityTab
