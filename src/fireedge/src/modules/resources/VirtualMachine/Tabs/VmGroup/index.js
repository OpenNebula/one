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
import PropTypes from 'prop-types'
import { Component, useMemo } from 'react'
import { Box } from '@mui/material'

import {
  Button,
  DetailsCard,
  EmptyContent,
  ResourceLink,
} from '@ComponentsModule'
import {
  RESOURCE_NAMES,
  STYLE_BUTTONS,
  T,
  VM_ACTION_ENUM,
} from '@ConstantsModule'
import { VmGroupAPI, useGeneralApi, useModalsApi } from '@FeaturesModule'
import { getVmGroupRoles } from '@ModelsModule'
import * as VirtualMachine from '@modules/resources/VirtualMachine'
import { getStyles } from '@modules/resources/VirtualMachine/Tabs/VmGroup/styles'

const hasValue = (value) =>
  value !== undefined && value !== null && value !== ''

const formatIds = (value) =>
  []
    .concat(value ?? [])
    .flatMap((ids) => String(ids).split(','))
    .map((id) => id.trim())
    .filter(Boolean)
    .join(', ') || '-'

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab data
 * @param {object} root0.config - Tab view configuration
 * @returns {Component} VM Group association tab
 */
export const VmGroup = ({ data, config }) => {
  const { showModal } = useModalsApi()
  const { enqueueSuccess } = useGeneralApi()
  const { selectedVm, extendedVmData, vmIsLocked, isActionsDisabled } =
    data || {}
  const vm = extendedVmData?.ID === selectedVm?.ID ? extendedVmData : selectedVm
  const membership = []
    .concat(vm?.TEMPLATE?.VMGROUP ?? [])
    .find((entry) => entry && typeof entry === 'object')
  const vmGroupId = membership?.VMGROUP_ID
  const roleName = membership?.ROLE
  const isAssociated = hasValue(vmGroupId)

  const { data: vmGroup } = VmGroupAPI.useGetVMGroupQuery(
    { id: vmGroupId },
    { skip: !isAssociated }
  )
  const roles = useMemo(() => getVmGroupRoles(vmGroup), [vmGroup])
  const role = roles.find(({ NAME }) => NAME === roleName)

  const { actions, isLoading } = VirtualMachine.Actions.useActions({
    context:
      (fn) =>
      (params = {}) =>
        fn?.({ id: selectedVm?.ID, ...params }),
  })
  const commonActionContext = {
    actions,
    formContext: vm,
    onSuccess: (message) =>
      message && enqueueSuccess(message, [selectedVm?.ID]),
    showModal,
    viewConfig: config,
    vm: selectedVm,
  }
  const [associateOption] = VirtualMachine.Actions.Utils.generateMenuOptions({
    ...commonActionContext,
    keys: [VM_ACTION_ENUM.VMGROUP_ADD],
  })
  const [removeOption] = VirtualMachine.Actions.Utils.generateMenuOptions({
    ...commonActionContext,
    keys: [VM_ACTION_ENUM.VMGROUP_DEL],
    paramsContext: { vmGroupId },
  })
  const isDisabled = vmIsLocked || isActionsDisabled || isLoading

  if (!isAssociated) {
    return (
      <Box sx={(theme) => getStyles({ theme })}>
        <Box className="empty-container">
          <EmptyContent
            action={associateOption?.onClick}
            actionProps={{
              dataCy: 'associate-vm-group',
              isDisabled: isDisabled || associateOption?.isDisabled,
            }}
            actionTitle={associateOption?.title}
            subtitle={T.NoVMGroupDescription}
            title={T.NoVMGroup}
          />
        </Box>
      </Box>
    )
  }

  const vmGroupName = vmGroup?.NAME
  const vmGroupLabel = `#${vmGroupId}${vmGroupName ? ` ${vmGroupName}` : ''}`

  return (
    <Box sx={(theme) => getStyles({ theme })}>
      <Button
        {...removeOption}
        dataCy="remove-vm-group"
        isDisabled={isDisabled || removeOption?.isDisabled}
        type={STYLE_BUTTONS.TYPE.SECONDARY}
      />
      <Box className="card-container">
        <DetailsCard
          title={T.VMGroup}
          options={[
            [
              T.VMGroup,
              <ResourceLink
                key="vm-group"
                resource={RESOURCE_NAMES.VM_GROUP}
                data={{ ID: vmGroupId, NAME: vmGroupName }}
              >
                {vmGroupLabel}
              </ResourceLink>,
            ],
            [T.Role, roleName ?? '-'],
            [T.Policy, role?.POLICY ?? '-'],
            [T.Roles, roles.map(({ NAME }) => NAME).join(', ') || '-'],
            [T.AffinedHosts, formatIds(role?.HOST_AFFINED)],
            [T.AntiAffinedHosts, formatIds(role?.HOST_ANTI_AFFINED)],
          ]}
        />
      </Box>
    </Box>
  )
}

VmGroup.propTypes = {
  data: PropTypes.object,
  config: PropTypes.object,
}

VmGroup.id = 'vm_group'
VmGroup.title = T.VMGroup
