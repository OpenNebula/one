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

import { jsonToXml, timeFromMilliseconds, prettyBytes } from '@UtilsModule'
import { T, UNITS, VM_ACTIONS } from '@ConstantsModule'
import {
  DetailsCard,
  AttributesPanel,
  CapacityPanel,
  PermissionsTab,
  OwnershipTab,
  StatusTag,
  TagList,
} from '@ComponentsV2Module'
import { Box } from '@mui/material'
import { Copy as CopyIcon, Check as CopiedIcon } from 'iconoir-react'
import {
  getVirtualMachineState,
  getHypervisor,
  getIpAddresses,
  getVmHostname,
  isVmAvailableAction,
} from '@ModelsModule'
import { useClipboard } from '@HooksModule'
import PropTypes from 'prop-types'
import { Component } from 'react'
import { getStyles } from '@modules/resources/resources/VirtualMachine/Tabs/Info/styles'
import { ResizeCapacityForm } from '@modules/resources/resources/VirtualMachine/Forms'
import { useModalsApi, useSystemData, VmAPI } from '@FeaturesModule'

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab specific data
 * @param {object} root0.config - Tab view configuration
 * @returns {Component} - VM Instances info tab
 */
export const Info = ({ data, config }) => {
  const {
    selectedVm,
    extendedVmData,
    clusterName,
    attributes,
    isLoadingExtended,
    handleChangePermission,
    handleChangeOwnership,
    handleDeleteAttribute,
    handleAddAttribute,
    vmIsLocked,
    isActionsDisabled,
  } = data || {}

  const {
    attributes_panel: attributesPanel,
    capacity_panel: capacityPanel,
    information_panel: informationPanel,
    ownership_panel: ownershipPanel,
    permissions_panel: permissionsPanel,
  } = config || {}

  const { copy, isCopied } = useClipboard()
  const { showModal } = useModalsApi()
  const { oneConfig, adminGroup } = useSystemData()
  const { color: stateColor, name: stateName } =
    getVirtualMachineState(selectedVm) ?? {}
  const hypervisor = getHypervisor(selectedVm)
  const hostName = getVmHostname(selectedVm)
  const [resizeCapacity] = VmAPI.useResizeMutation()

  const handleResizeCapacity = async (formData) => {
    const { enforce, ...restOfData } = formData
    const restrictedAttributes = [].concat(oneConfig?.VM_RESTRICTED_ATTR ?? [])

    Object.keys(restOfData).forEach((key) => {
      if (restrictedAttributes.includes(key)) {
        delete restOfData[key]
      }
    })

    await resizeCapacity({
      id: selectedVm?.ID,
      enforce,
      template: jsonToXml(restOfData),
    })
  }

  const handleOpenResizeCapacityForm = () => {
    if (!selectedVm?.ID) return

    showModal({
      id: 'resize-capacity-vm',
      dialogProps: {
        title: T.ResizeCapacity,
        dataCy: 'modal-resize-capacity',
        dialogWidth: { xs: 'calc(100vw - 32px)', sm: '560px', md: '640px' },
        dialogMaxWidth: 'calc(100vw - 32px)',
      },
      form: ResizeCapacityForm({
        initialValues: extendedVmData?.TEMPLATE ?? selectedVm?.TEMPLATE,
        stepProps: { oneConfig, adminGroup, nameParentAttribute: '' },
      }),
      onSubmit: handleResizeCapacity,
    })
  }

  const isResizeCapacityEnabled =
    capacityPanel?.actions?.resize === true &&
    selectedVm?.ID &&
    isVmAvailableAction(VM_ACTIONS.RESIZE_CAPACITY, selectedVm)

  return (
    <Box sx={(theme) => getStyles({ theme })}>
      <Box className="topContainer">
        {informationPanel?.enabled && (
          <Box className="detailsContainer">
            <DetailsCard
              title={T.VmDetails}
              options={[
                [T.ID, selectedVm?.ID],
                [T.Name, selectedVm?.NAME],
                [
                  T.State,
                  <StatusTag
                    key="vm-state"
                    statusColor={stateColor}
                    statusName={stateName}
                  />,
                ],
                [T.Owner, selectedVm?.UNAME],
                [T.Reschedule, +selectedVm?.RESCHED !== 0 ? T.Yes : T.No],
                [T.Locked, vmIsLocked ? T.Yes : T.No],
                [
                  T.ip,
                  ((ips) =>
                    ips.length ? (
                      <TagList
                        key="ip-array"
                        max={1}
                        tags={ips.map((ip) => ({
                          title: ip,
                          endIcon: isCopied(ip) ? <CopiedIcon /> : <CopyIcon />,
                          onClick: () => copy(ip),
                        }))}
                      />
                    ) : (
                      '-'
                    ))(getIpAddresses(selectedVm)),
                ],
                [
                  T.StartTime,
                  String(
                    timeFromMilliseconds(selectedVm?.STIME ?? 0).toFormat(
                      'dd/MM/yyyy, HH:mm:ss'
                    )
                  ),
                ],
                [
                  T.EndTime,
                  +selectedVm?.ETIME
                    ? String(
                        timeFromMilliseconds(selectedVm?.ETIME ?? 0).toFormat(
                          'dd/MM/yyyy, HH:mm:ss'
                        )
                      )
                    : '-',
                ],
                [T.Hypervisor, hypervisor ?? '-'],
                [T.Host, hostName ?? T.Unknown, T.Hostname],
                [T.Cluster, clusterName ?? '-'],
                [T.DeployID, selectedVm?.DEPLOY_ID ?? '-'],
              ]}
            />
          </Box>
        )}
        <Box className="permissionsOwnershipContainer">
          {permissionsPanel?.enabled && (
            <PermissionsTab
              title={T.Permissions}
              actions={permissionsPanel?.actions}
              options={{
                ownerUse: extendedVmData?.PERMISSIONS?.OWNER_U,
                ownerManage: extendedVmData?.PERMISSIONS?.OWNER_M,
                ownerAdmin: extendedVmData?.PERMISSIONS?.OWNER_A,
                groupUse: extendedVmData?.PERMISSIONS?.GROUP_U,
                groupManage: extendedVmData?.PERMISSIONS?.GROUP_M,
                groupAdmin: extendedVmData?.PERMISSIONS?.GROUP_A,
                otherUse: extendedVmData?.PERMISSIONS?.OTHER_U,
                otherManage: extendedVmData?.PERMISSIONS?.OTHER_M,
                otherAdmin: extendedVmData?.PERMISSIONS?.OTHER_A,
              }}
              handleEdit={handleChangePermission}
              isDisabled={vmIsLocked || isActionsDisabled}
            />
          )}
          {ownershipPanel?.enabled && (
            <OwnershipTab
              title={T.Ownership}
              actions={ownershipPanel?.actions}
              userId={+selectedVm?.UID}
              userName={selectedVm?.UNAME}
              groupId={+selectedVm?.GID}
              groupName={selectedVm?.GNAME}
              handleEdit={handleChangeOwnership}
              isDisabled={vmIsLocked || isActionsDisabled}
              size="small"
            />
          )}
        </Box>
        {capacityPanel?.enabled && (
          <Box className="capacityContainer">
            <CapacityPanel
              isLoading={isLoadingExtended}
              title={T.Capacity}
              options={[
                [T.CPU, extendedVmData?.TEMPLATE?.CPU ?? '-'],
                [`${T.Cost} ${T.CPU}`, extendedVmData?.TEMPLATE?.CPU_COST || 0],
                [T.VCPU, extendedVmData?.TEMPLATE?.VCPU || '-'],
                [
                  `${T.Cost} ${T.Memory}`,
                  extendedVmData?.TEMPLATE?.MEMORY_COST || 0,
                ],
                [
                  T.Memory,
                  prettyBytes(extendedVmData?.TEMPLATE?.MEMORY ?? 0, UNITS.MB),
                ],
                [
                  `${T.Cost} ${T.Disk}`,
                  extendedVmData?.TEMPLATE?.DISK_COST || 0,
                ],
              ]}
              actions={capacityPanel?.actions}
              handleEdit={handleOpenResizeCapacityForm}
              isDisabled={
                !isResizeCapacityEnabled || vmIsLocked || isActionsDisabled
              }
            />
          </Box>
        )}
      </Box>
      {attributesPanel?.enabled && (
        <Box className="attributesContainer">
          <AttributesPanel
            title={T.Attributes}
            attributes={attributes}
            actions={attributesPanel?.actions}
            handleDelete={handleDeleteAttribute}
            handleAdd={handleAddAttribute}
            isLoading={isLoadingExtended}
            isFullHeight={false}
          />
        </Box>
      )}
    </Box>
  )
}

Info.propTypes = {
  data: PropTypes.object,
  config: PropTypes.object,
}

Info.id = 'info'
Info.title = T.Info
