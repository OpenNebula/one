/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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
import { ReactElement, useMemo } from 'react'
import PropTypes from 'prop-types'
import { Stack } from '@mui/material'

import { useGetVmQuery } from 'client/features/OneApi/vm'
import NicCard from 'client/components/Cards/NicCard'
import {
  AttachAction,
  DetachAction,
  UpdateAction,
  AttachSecGroupAction,
  DetachSecGroupAction,
} from 'client/components/Tabs/Vm/Network/Actions'
import Graphs from 'client/components/Tabs/Vm/Network/Graphs'
import {
  getNics,
  getHypervisor,
  isAvailableAction,
} from 'client/models/VirtualMachine'
import { getActionsAvailable } from 'client/models/Helper'
import { VM_ACTIONS } from 'client/constants'

const {
  ATTACH_NIC,
  DETACH_NIC,
  UPDATE_NIC,
  ATTACH_SEC_GROUP,
  DETACH_SEC_GROUP,
} = VM_ACTIONS

/**
 * Renders the list of networks from a VM.
 *
 * @param {object} props - Props
 * @param {object} props.tabProps - Tab information
 * @param {string[]} props.tabProps.actions - Actions tab
 * @param {string} props.id - Virtual Machine id
 * @param {object} props.oneConfig - OpenNEbula configuration
 * @param {boolean} props.adminGroup - If the user is admin
 * @returns {ReactElement} Networks tab
 */
const VmNetworkTab = ({
  tabProps: { actions } = {},
  id,
  oneConfig,
  adminGroup,
}) => {
  const { data: vm } = useGetVmQuery({ id })

  const [nics, hypervisor, actionsAvailable] = useMemo(() => {
    const groupedNics = getNics(vm, {
      groupAlias: true,
      securityGroupsFromTemplate: true,
    })
    const hyperV = getHypervisor(vm)
    const actionsByHypervisor = getActionsAvailable(actions, hyperV)
    const actionsByState = actionsByHypervisor.filter((action) =>
      isAvailableAction(action, vm)
    )

    return [groupedNics, hyperV, actionsByState]
  }, [vm])

  return (
    <div>
      {actionsAvailable?.includes?.(ATTACH_NIC) && (
        <AttachAction
          vmId={id}
          currentNics={nics}
          hypervisor={hypervisor}
          oneConfig={oneConfig}
          adminGroup={adminGroup}
        />
      )}

      <Stack gap="1em" py="0.8em">
        {nics.map((nic) => {
          const { IP, MAC, ADDRESS } = nic
          const key = IP ?? MAC ?? ADDRESS // address only exists form PCI nics

          return (
            <NicCard
              key={key}
              nic={nic}
              actions={
                <>
                  {actionsAvailable.includes(DETACH_NIC) && (
                    <DetachAction nic={nic} vmId={id} />
                  )}
                  {actionsAvailable.includes(UPDATE_NIC) && (
                    <UpdateAction nic={nic} vmId={id} />
                  )}
                  {actionsAvailable.includes(ATTACH_SEC_GROUP) && (
                    <AttachSecGroupAction nic={nic} vmId={id} />
                  )}
                </>
              }
              aliasActions={({ alias }) =>
                actionsAvailable.includes(DETACH_NIC) && (
                  <DetachAction nic={alias} vmId={id} />
                )
              }
              securityGroupActions={({ securityGroupId }) =>
                actionsAvailable.includes(DETACH_SEC_GROUP) && (
                  <DetachSecGroupAction
                    nic={nic}
                    vmId={id}
                    securityGroupId={securityGroupId}
                  />
                )
              }
            />
          )
        })}
      </Stack>
      <Graphs id={id} />
    </div>
  )
}

VmNetworkTab.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
}

VmNetworkTab.displayName = 'VmNetworkTab'

export default VmNetworkTab
