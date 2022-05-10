/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
import { ReactElement, useMemo, useCallback } from 'react'
import PropTypes from 'prop-types'
import { Stack, Alert, Fade } from '@mui/material'
import { Cancel as CloseIcon } from 'iconoir-react'

import {
  useGetVmQuery,
  useChangeVmOwnershipMutation,
  useChangeVmPermissionsMutation,
  useUpdateUserTemplateMutation,
} from 'client/features/OneApi/vm'
import {
  Permissions,
  Ownership,
  AttributePanel,
} from 'client/components/Tabs/Common'
import Information from 'client/components/Tabs/Vm/Info/information'
import { SubmitButton } from 'client/components/FormControl'

import { Tr, Translate } from 'client/components/HOC'
import { T } from 'client/constants'
import { getHypervisor } from 'client/models/VirtualMachine'
import {
  getActionsAvailable,
  filterAttributes,
  jsonToXml,
  getErrorMessage,
} from 'client/models/Helper'
import { cloneObject, set } from 'client/utils'

const LXC_ATTRIBUTES_REG = /^LXC_/
const VCENTER_ATTRIBUTES_REG = /^VCENTER_/
const HIDDEN_ATTRIBUTES_REG = /^(USER_INPUTS|BACKUP|HOT_RESIZE)$|SCHED_|ERROR/
const HIDDEN_MONITORING_REG =
  /^(CPU|MEMORY|NETTX|NETRX|STATE|DISK_SIZE|SNAPSHOT_SIZE)$/

/**
 * Renders mainly information tab.
 *
 * @param {object} props - Props
 * @param {object} props.tabProps - Tab information
 * @param {string} props.id - Virtual machine id
 * @returns {ReactElement} Information tab
 */
const VmInfoTab = ({ tabProps = {}, id }) => {
  const {
    information_panel: informationPanel,
    permissions_panel: permissionsPanel,
    ownership_panel: ownershipPanel,
    vcenter_panel: vcenterPanel,
    lxc_panel: lxcPanel,
    monitoring_panel: monitoringPanel,
    attributes_panel: attributesPanel,
  } = tabProps

  const { data: vm = {} } = useGetVmQuery({ id })
  const [changeVmOwnership] = useChangeVmOwnershipMutation()
  const [changeVmPermissions] = useChangeVmPermissionsMutation()
  const [updateUserTemplate] = useUpdateUserTemplateMutation()
  const [dismissError] = useUpdateUserTemplateMutation()

  const { UNAME, UID, GNAME, GID, PERMISSIONS, USER_TEMPLATE, MONITORING } = vm

  const error = useMemo(() => getErrorMessage(vm), [vm])
  const hypervisor = useMemo(() => getHypervisor(vm), [vm])

  const {
    attributes,
    lxc: lxcAttributes,
    vcenter: vcenterAttributes,
  } = filterAttributes(USER_TEMPLATE, {
    extra: {
      vcenter: VCENTER_ATTRIBUTES_REG,
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

  const handleDismissError = async () => {
    const { ERROR, SCHED_MESSAGE, ...templateWithoutError } = USER_TEMPLATE
    const xml = jsonToXml({ ...templateWithoutError })

    await dismissError({ id, template: xml, replace: 0 })
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
      <Fade in={!!error} unmountOnExit>
        <Alert
          variant="outlined"
          severity="error"
          sx={{ gridColumn: 'span 2' }}
          action={
            <SubmitButton
              onClick={handleDismissError}
              icon={<CloseIcon />}
              tooltip={<Translate word={T.Dismiss} />}
            />
          }
        >
          {error}
        </Alert>
      </Fade>
      {informationPanel?.enabled && (
        <Information actions={getActions(informationPanel?.actions)} vm={vm} />
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
      {attributesPanel?.enabled && attributes && (
        <AttributePanel
          {...ATTRIBUTE_FUNCTION}
          attributes={attributes}
          actions={getActions(attributesPanel?.actions)}
          title={`${Tr(T.Attributes)}`}
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
}

VmInfoTab.displayName = 'VmInfoTab'

export default VmInfoTab
