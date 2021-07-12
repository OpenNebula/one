/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
 *                                                                           *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may   *
 * not use this file except in compliance with the License. You may obtain   *
 * a copy of the License at                                                  *
 *                                                                           *
 * http://www.apache.org/licenses/LICENSE-2.0                                *
 *                                                                           *
 * Unless required by applicable law or agreed to in writing, software       *
 * distributed under the License is distributed on an "AS IS" BASIS,         *
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  *
 * See the License for the specific language governing permissions and       *
 * limitations under the License.                                            *
 * ------------------------------------------------------------------------- */
/* eslint-disable jsdoc/require-jsdoc */
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
