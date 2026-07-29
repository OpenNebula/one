/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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

import { VmAPI, useGeneralApi } from '@FeaturesModule'
import NicCard from '@modules/resources/Cards/NicCard'
import {
  AttachAction,
  DetachAction,
  UpdateAction,
  AttachSecGroupAction,
  DetachSecGroupAction,
  AliasAction,
} from '@modules/resources/Tabs/Vm/Network/Actions'
import Graphs from '@modules/resources/Tabs/Vm/Network/Graphs'
import {
  getNics,
  getHypervisor,
  isVmAvailableAction,
  getActionsAvailable,
  jsonToXml,
} from '@UtilsModule'
import { useTranslation } from '@ProvidersModule'
import { VM_ACTIONS, T, PCI_TYPES } from '@ConstantsModule'
import { filter } from 'lodash'

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
  const { translate } = useTranslation()
  // General api for enqueue
  const { enqueueSuccess } = useGeneralApi()

  // API to attach and detach NIC
  const [attachNic, { isSuccess: isSuccessAttachNic }] =
    VmAPI.useAttachNicMutation()
  const [detachNic, { isSuccess: isSuccessDetachNic }] =
    VmAPI.useDetachNicMutation()
  const [updateNic, { isSuccess: isSuccessUpdateNic }] =
    VmAPI.useUpdateNicMutation()

  // Success messages
  const successMessageAttachNic = `${translate(T.AttachNicSuccess, [id])}`
  useEffect(
    () => isSuccessAttachNic && enqueueSuccess(successMessageAttachNic),
    [isSuccessAttachNic]
  )
  const successMessageDetachNic = `${translate(T.DetachNicSuccess, [id])}`
  useEffect(
    () => isSuccessDetachNic && enqueueSuccess(successMessageDetachNic),
    [isSuccessDetachNic]
  )
  const successMessageUpdateNic = `${translate(T.UpdatedNicSuccess, [id])}`
  useEffect(
    () => isSuccessUpdateNic && enqueueSuccess(successMessageUpdateNic),
    [isSuccessUpdateNic]
  )

  // Get data from vm
  const { data: vm } = VmAPI.useGetVmQuery({ id })

  const history = [].concat(vm?.HISTORY_RECORDS?.HISTORY)
  const hostId = (
    history.find((h) => h?.ETIME === '0' || h?.ETIME === 0) ?? history.at(-1)
  )?.HID

  // Set nics, hypervisor and actions
  const [nics, hypervisor, actionsAvailable] = useMemo(() => {
    const groupedNics = getNics(vm, {
      groupAlias: false,
      securityGroupsFromTemplate: true,
    })
    const hyperV = getHypervisor(vm)
    const actionsByHypervisor = getActionsAvailable(actions, hyperV)
    const actionsByState = actionsByHypervisor.filter((action) =>
      isVmAvailableAction(action, vm)
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
          disableNetworkAutoMode={true}
          hostId={hostId}
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
                  <Stack direction="row" spacing={1}>
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
                  </Stack>
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
