/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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
import { ReactElement, useMemo, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Stack } from '@mui/material'

import {
  useGetVmQuery,
  useAttachNicMutation,
  useDetachNicMutation,
  useUpdateNicMutation,
} from 'client/features/OneApi/vm'
import NicCard from 'client/components/Cards/NicCard'
import {
  AttachAction,
  DetachAction,
  UpdateAction,
  AttachSecGroupAction,
  DetachSecGroupAction,
  AliasAction,
} from 'client/components/Tabs/Vm/Network/Actions'
import Graphs from 'client/components/Tabs/Vm/Network/Graphs'
import {
  getNics,
  getHypervisor,
  isAvailableAction,
} from 'client/models/VirtualMachine'
import { getActionsAvailable, jsonToXml } from 'client/models/Helper'
import { VM_ACTIONS, T, PCI_TYPES } from 'client/constants'
import { filter } from 'lodash'

import { Tr } from 'client/components/HOC'
import { useGeneralApi } from 'client/features/General'

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
  // General api for enqueue
  const { enqueueSuccess } = useGeneralApi()

  // API to attach and detach NIC
  const [attachNic, { isSuccess: isSuccessAttachNic }] = useAttachNicMutation()
  const [detachNic, { isSuccess: isSuccessDetachNic }] = useDetachNicMutation()
  const [updateNic, { isSuccess: isSuccessUpdateNic }] = useUpdateNicMutation()

  // Success messages
  const successMessageAttachNic = `${Tr(T.AttachNicSuccess, [id])}`
  useEffect(
    () => isSuccessAttachNic && enqueueSuccess(successMessageAttachNic),
    [isSuccessAttachNic]
  )
  const successMessageDetachNic = `${Tr(T.DetachNicSuccess, [id])}`
  useEffect(
    () => isSuccessDetachNic && enqueueSuccess(successMessageDetachNic),
    [isSuccessDetachNic]
  )
  const successMessageUpdateNic = `${Tr(T.UpdatedNicSuccess, [id])}`
  useEffect(
    () => isSuccessUpdateNic && enqueueSuccess(successMessageUpdateNic),
    [isSuccessUpdateNic]
  )

  // Get data from vm
  const { data: vm } = useGetVmQuery({ id })

  // Set nics, hypervisor and actions
  const [nics, hypervisor, actionsAvailable] = useMemo(() => {
    const groupedNics = getNics(vm, {
      groupAlias: false,
      securityGroupsFromTemplate: true,
    })
    const hyperV = getHypervisor(vm)
    const actionsByHypervisor = getActionsAvailable(actions, hyperV)
    const actionsByState = actionsByHypervisor.filter((action) =>
      isAvailableAction(action, vm)
    )

    return [groupedNics, hyperV, actionsByState]
  }, [vm])

  // Handle actions on NIC and alias
  const handleAttach = async (formData) => {
    // Add type if it's a pci nic
    if (Object.values(PCI_TYPES).includes(formData?.PCI_TYPE)) {
      formData.TYPE = 'NIC'

      await attachNic({
        id: id,
        template: jsonToXml({ PCI: formData }),
      })
    } else {
      await attachNic({
        id: id,
        template: jsonToXml({ NIC: formData }),
      })
    }
  }
  const handleDetach = (nicId) => async () =>
    await detachNic({ id: id, nic: nicId })
  const handleUpdate = (nicId) => async (formData) => {
    if (Object.values(PCI_TYPES).includes(formData?.PCI_TYPE)) {
      await updateNic({
        id: id,
        nic: nicId,
        template: jsonToXml({ PCI: formData }),
      })
    } else {
      await updateNic({
        id: id,
        nic: nicId,
        template: jsonToXml({ NIC: formData }),
      })
    }
  }

  return (
    <div>
      {actionsAvailable?.includes?.(ATTACH_NIC) && (
        <AttachAction
          currentNics={nics}
          hypervisor={hypervisor}
          oneConfig={oneConfig}
          adminGroup={adminGroup}
          onSubmit={handleAttach}
        />
      )}

      <Stack gap="1em" py="0.8em">
        {nics
          .filter((nic) => !nic.PARENT)
          .map((nic) => {
            const { IP, MAC, ADDRESS } = nic
            const key = IP ?? MAC ?? ADDRESS // address only exists form PCI nics

            const hasAlias = nics.find(
              (aliasItem) => aliasItem.PARENT === nic.NAME
            )

            return (
              <NicCard
                key={key}
                nic={nic}
                hasAlias={hasAlias}
                aliasLength={filter(nics, { PARENT: nic?.NAME }).length}
                actions={
                  <>
                    {actionsAvailable.includes(DETACH_NIC) && (
                      <DetachAction
                        nic={nic}
                        vmId={id}
                        oneConfig={oneConfig}
                        adminGroup={adminGroup}
                        onSubmit={handleDetach(nic.NIC_ID)}
                      />
                    )}
                    {actionsAvailable.includes(UPDATE_NIC) && (
                      <UpdateAction
                        nic={nic}
                        vmId={id}
                        oneConfig={oneConfig}
                        adminGroup={adminGroup}
                        onSubmit={handleUpdate(nic.NIC_ID)}
                      />
                    )}
                    {actionsAvailable.includes(ATTACH_SEC_GROUP) && (
                      <AttachSecGroupAction nic={nic} vmId={id} />
                    )}
                    <AliasAction nic={nic} alias={nics} vmId={id} />
                  </>
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
