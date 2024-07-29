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
import { Stack } from '@mui/material'
import PropTypes from 'prop-types'
import { ReactElement, useCallback, useMemo } from 'react'

import {
  AttributePanel,
  Ownership,
  Permissions,
} from 'client/components/Tabs/Common'
import Graphs from 'client/components/Tabs/Vm/Info/Graphs'
import Capacity from 'client/components/Tabs/Vm/Info/capacity'
import Information from 'client/components/Tabs/Vm/Info/information'
import {
  useChangeVmOwnershipMutation,
  useChangeVmPermissionsMutation,
  useGetVmQuery,
  useUpdateUserTemplateMutation,
} from 'client/features/OneApi/vm'

import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'
import {
  filterAttributes,
  getActionsAvailable,
  jsonToXml,
} from 'client/models/Helper'
import { getHypervisor } from 'client/models/VirtualMachine'
import { cloneObject, set } from 'client/utils'

const LXC_ATTRIBUTES_REG = /^LXC_/
const HIDDEN_ATTRIBUTES_REG = /^(USER_INPUTS|BACKUP|HOT_RESIZE)$|SCHED_|ERROR/
const HIDDEN_MONITORING_REG =
  /^(CPU|MEMORY|NETTX|NETRX|STATE|DISK_SIZE|SNAPSHOT_SIZE)$/

/**
 * Renders mainly information tab.
 *
 * @param {object} props - Props
 * @param {object} props.tabProps - Tab information
 * @param {string} props.id - Virtual machine id
 * @param {object} props.oneConfig - OpenNebula configuration
 * @param {boolean} props.adminGroup - If the user is admin
 * @returns {ReactElement} Information tab
 */
const VmInfoTab = ({ tabProps = {}, id, oneConfig, adminGroup }) => {
  const {
    information_panel: informationPanel,
    capacity_panel: capacityPanel,
    permissions_panel: permissionsPanel,
    ownership_panel: ownershipPanel,
    lxc_panel: lxcPanel,
    monitoring_panel: monitoringPanel,
    attributes_panel: attributesPanel,
  } = tabProps

  const { data: vm = {} } = useGetVmQuery({ id })
  const [changeVmOwnership] = useChangeVmOwnershipMutation()
  const [changeVmPermissions] = useChangeVmPermissionsMutation()
  const [updateUserTemplate] = useUpdateUserTemplateMutation()

  const { UNAME, UID, GNAME, GID, PERMISSIONS, USER_TEMPLATE, MONITORING } = vm

  const hypervisor = useMemo(() => getHypervisor(vm), [vm])

  const { attributes, lxc: lxcAttributes } = filterAttributes(USER_TEMPLATE, {
    extra: {
      lxc: LXC_ATTRIBUTES_REG,
    },
    hidden: HIDDEN_ATTRIBUTES_REG,
  })

  const { attributes: monitoringAttributes } = filterAttributes(MONITORING, {
    hidden: HIDDEN_MONITORING_REG,
  })

  const handleChangeOwnership = async (newOwnership) => {
    await changeVmOwnership({ id, ...newOwnership })
  }

  const handleChangePermission = async (newPermission) => {
    await changeVmPermissions({ id, ...newPermission })
  }

  const handleAttributeInXml = async (path, newValue) => {
    const newTemplate = cloneObject(USER_TEMPLATE)
    set(newTemplate, path, newValue)

    const xml = jsonToXml(newTemplate)
    await updateUserTemplate({ id, template: xml, replace: 0 })
  }

  const getActions = useCallback(
    (actions) => getActionsAvailable(actions, hypervisor),
    [hypervisor]
  )

  const ATTRIBUTE_FUNCTION = {
    handleAdd: handleAttributeInXml,
    handleEdit: handleAttributeInXml,
    handleDelete: handleAttributeInXml,
  }

  return (
    <Stack
      display="grid"
      gap="1em"
      gridTemplateColumns="repeat(auto-fit, minmax(49%, 1fr))"
      padding={{ sm: '0.8em' }}
    >
      {informationPanel?.enabled && (
        <Information
          actions={getActions(informationPanel?.actions)}
          vm={vm}
          oneConfig={oneConfig}
          adminGroup={adminGroup}
        />
      )}
      {permissionsPanel?.enabled && (
        <Permissions
          actions={getActions(permissionsPanel?.actions)}
          handleEdit={handleChangePermission}
          ownerUse={PERMISSIONS.OWNER_U}
          ownerManage={PERMISSIONS.OWNER_M}
          ownerAdmin={PERMISSIONS.OWNER_A}
          groupUse={PERMISSIONS.GROUP_U}
          groupManage={PERMISSIONS.GROUP_M}
          groupAdmin={PERMISSIONS.GROUP_A}
          otherUse={PERMISSIONS.OTHER_U}
          otherManage={PERMISSIONS.OTHER_M}
          otherAdmin={PERMISSIONS.OTHER_A}
        />
      )}
      {ownershipPanel?.enabled && (
        <Ownership
          actions={getActions(ownershipPanel?.actions)}
          handleEdit={handleChangeOwnership}
          userId={UID}
          userName={UNAME}
          groupId={GID}
          groupName={GNAME}
        />
      )}
      {capacityPanel?.enabled && (
        <>
          <Capacity
            actions={getActions(capacityPanel?.actions)}
            vm={vm}
            oneConfig={oneConfig}
            adminGroup={adminGroup}
          />
          <Graphs id={id} />
        </>
      )}
      {attributesPanel?.enabled && attributes && (
        <AttributePanel
          {...ATTRIBUTE_FUNCTION}
          collapse
          attributes={attributes}
          actions={getActions(attributesPanel?.actions)}
          title={`${Tr(T.Attributes)}`}
        />
      )}
      {lxcPanel?.enabled && lxcAttributes && (
        <AttributePanel
          {...ATTRIBUTE_FUNCTION}
          collapse
          actions={getActions(lxcPanel?.actions)}
          attributes={lxcAttributes}
          title={`LXC ${Tr(T.Information)}`}
        />
      )}
      {monitoringPanel?.enabled && monitoringAttributes && (
        <AttributePanel
          collapse
          actions={getActions(monitoringPanel?.actions)}
          attributes={monitoringAttributes}
          title={`${Tr(T.Monitoring)}`}
        />
      )}
    </Stack>
  )
}

VmInfoTab.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
}

VmInfoTab.displayName = 'VmInfoTab'

export default VmInfoTab
