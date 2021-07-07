import * as React from 'react'

import * as VirtualMachine from 'client/models/VirtualMachine'

const VmNetworkTab = data => {
  const nics = VirtualMachine.getNics(data, true)
  // const { nics, alias } = VirtualMachine.splitNicAlias(data)

  console.log(nics)

  return (
    <div>
      <div>
        <p>VM NICS</p>
        {nics.map(({ NIC_ID, NETWORK = '-', BRIDGE = '-', IP = '-', MAC = '-', PCI_ID = '', ALIAS }) => (
          <div key={NIC_ID}>
            <p>
              {`${NIC_ID} | ${NETWORK} | ${BRIDGE} | ${IP} | ${MAC} | ${PCI_ID}`}
            </p>
            {ALIAS?.map(({ NIC_ID, NETWORK = '-', BRIDGE = '-', IP = '-', MAC = '-' }) => (
              <p key={NIC_ID} style={{ marginLeft: '1em' }}>
                {`${NIC_ID} | ${NETWORK} | ${BRIDGE} | ${IP} | ${MAC}`}
              </p>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

VmNetworkTab.displayName = 'VmNetworkTab'

export default VmNetworkTab
