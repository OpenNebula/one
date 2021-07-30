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
import PropTypes from 'prop-types'

import { useVmApi } from 'client/features/One'
import { TabContext } from 'client/components/Tabs/TabProvider'
import { Permissions, Ownership, AttributePanel } from 'client/components/Tabs/Common'
import Information from 'client/components/Tabs/Vm/Info/information'

import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'
import * as VirtualMachine from 'client/models/VirtualMachine'
import * as Helper from 'client/models/Helper'
import { cloneObject, set } from 'client/utils'

const LXC_ATTRIBUTES_REG = /^LXC_/
const VCENTER_ATTRIBUTES_REG = /^VCENTER_/
const HIDDEN_ATTRIBUTES_REG = /^(USER_INPUTS|BACKUP|HOT_RESIZE)$|SCHED_|ERROR/
const HIDDEN_MONITORING_REG = /^(CPU|MEMORY|NETTX|NETRX|STATE|DISK_SIZE|SNAPSHOT_SIZE)$/

const VmInfoTab = ({ tabProps = {} }) => {
  const {
    information_panel: informationPanel,
    permissions_panel: permissionsPanel,
    ownership_panel: ownershipPanel,
    vcenter_panel: vcenterPanel,
    lxc_panel: lxcPanel,
    monitoring_panel: monitoringPanel,
    attributes_panel: attributesPanel
  } = tabProps

  const { changeOwnership, changePermissions, rename, updateUserTemplate } = useVmApi()
  const { handleRefetch, data: vm = {} } = React.useContext(TabContext)
  const { ID, UNAME, UID, GNAME, GID, PERMISSIONS, USER_TEMPLATE, MONITORING } = vm

  const handleChangeOwnership = async newOwnership => {
    const response = await changeOwnership(ID, newOwnership)
    String(response) === String(ID) && await handleRefetch?.()
  }

  const handleChangePermission = async newPermission => {
    const response = await changePermissions(ID, newPermission)
    String(response) === String(ID) && await handleRefetch?.()
  }

  const handleRename = async newName => {
    const response = await rename(ID, newName)
    String(response) === String(ID) && await handleRefetch?.()
  }

  const handleAttributeInXml = async (newValue, path) => {
    const newTemplate = cloneObject(USER_TEMPLATE)

    set(newTemplate, path, newValue)

    const xml = Helper.jsonToXml(newTemplate)

    // 0: Replace the whole user template
    const response = await updateUserTemplate(ID, xml, 0)

    String(response) === String(ID) && await handleRefetch?.()
  }

  const hypervisor = VirtualMachine.getHypervisor(vm)
  const getActions = actions => Helper.getActionsAvailable(actions, hypervisor)

  const {
    attributes,
    lxc: lxcAttributes,
    vcenter: vcenterAttributes
  } = Helper.filterAttributes(USER_TEMPLATE, {
    extra: {
      vcenter: VCENTER_ATTRIBUTES_REG,
      lxc: LXC_ATTRIBUTES_REG
    },
    hidden: HIDDEN_ATTRIBUTES_REG
  })

  const {
    attributes: monitoringAttributes
  } = Helper.filterAttributes(MONITORING, { hidden: HIDDEN_MONITORING_REG })

  const ATTRIBUTE_FUNCTION = {
    handleAdd: handleAttributeInXml,
    handleEdit: handleAttributeInXml,
    handleDelete: path => handleAttributeInXml(undefined, path)
  }

  return (
    <div style={{
      display: 'grid',
      gap: '1em',
      gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
      padding: '0.8em'
    }}>
      {informationPanel?.enabled &&
        <Information
          actions={getActions(informationPanel?.actions)}
          handleRename={handleRename}
          vm={vm}
        />
      }
      {permissionsPanel?.enabled &&
        <Permissions
          actions={getActions(permissionsPanel?.actions)}
          ownerUse={PERMISSIONS.OWNER_U}
          ownerManage={PERMISSIONS.OWNER_M}
          ownerAdmin={PERMISSIONS.OWNER_A}
          groupUse={PERMISSIONS.GROUP_U}
          groupManage={PERMISSIONS.GROUP_M}
          groupAdmin={PERMISSIONS.GROUP_A}
          otherUse={PERMISSIONS.OTHER_U}
          otherManage={PERMISSIONS.OTHER_M}
          otherAdmin={PERMISSIONS.OTHER_A}
          handleEdit={handleChangePermission}
        />
      }
      {ownershipPanel?.enabled &&
        <Ownership
          actions={getActions(ownershipPanel?.actions)}
          userId={UID}
          userName={UNAME}
          groupId={GID}
          groupName={GNAME}
          handleEdit={handleChangeOwnership}
        />
      }
      {attributesPanel?.enabled && attributes && (
        <AttributePanel
          {...ATTRIBUTE_FUNCTION}
          attributes={attributes}
          actions={getActions(attributesPanel?.actions)}
          title={Tr(T.Attributes)}
        />
      )}
      {vcenterPanel?.enabled && vcenterAttributes && (
        <AttributePanel
          {...ATTRIBUTE_FUNCTION}
          actions={getActions(vcenterPanel?.actions)}
          attributes={vcenterAttributes}
          title={`vCenter ${Tr(T.Information)}`}
        />
      )}
      {lxcPanel?.enabled && lxcAttributes && (
        <AttributePanel
          {...ATTRIBUTE_FUNCTION}
          actions={getActions(lxcPanel?.actions)}
          attributes={lxcAttributes}
          title={`LXC ${Tr(T.Information)}`}
        />
      )}
      {monitoringPanel?.enabled && monitoringAttributes && (
        <AttributePanel
          attributes={monitoringAttributes}
          title={Tr(T.Monitoring)}
        />
      )}
    </div>
  )
}

VmInfoTab.propTypes = {
  tabProps: PropTypes.object
}

VmInfoTab.displayName = 'VmInfoTab'

export default VmInfoTab
