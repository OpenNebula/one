import * as React from 'react'

import * as VirtualMachine from 'client/models/VirtualMachine'

const VmNetworkTab = data => {
  const { nics, alias } = VirtualMachine.splitNicAlias(data)

  return (
    <div>
      <div>
        <p>VM NICS</p>
        {nics.map(({ NIC_ID, NETWORK = '-', BRIDGE = '-', IP = '-', MAC = '-', PCI_ID = '' }) => (
          <p key={NIC_ID}>
            {`${NIC_ID} | ${NETWORK} | ${BRIDGE} | ${IP} | ${MAC} | ${PCI_ID}`}
          </p>
        ))}
      </div>
      <hr />
      <div>
        <p>VM ALIAS</p>
        {alias.map(({ NIC_ID, NETWORK = '-', BRIDGE = '-', IP = '-', MAC = '-' }) => (
          <p key={NIC_ID}>
            {`${NIC_ID} | ${NETWORK} | ${BRIDGE} | ${IP} | ${MAC}`}
          </p>
        ))}
      </div>
    </div>
  )
}

VmNetworkTab.displayName = 'VmNetworkTab'

export default VmNetworkTab
