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

import {
  DetailsDrawer,
  getLabelMenuButtonProps,
  InfoSlot,
  SummarySlot,
  TabSlot,
  ToggleGroup,
  ButtonGroup,
  ResourceActionConfirmation,
} from '@ComponentsV2Module'
import { Component } from 'react'
import { RESOURCE_NAMES, T, PATH } from '@ConstantsModule'
import { Box, useTheme } from '@mui/material'
import PropTypes from 'prop-types'
import { RefreshDouble, Edit, Cancel, Trash, Lock, NoLock } from 'iconoir-react'
import { useHistory } from 'react-router'
import { VmGroupAPI, useModalsApi } from '@FeaturesModule'
import {
  getLabelTags,
  getVmGroupTotalRoles,
  getVmGroupTotalVms,
  vmgroupVmTable,
} from '@ModelsModule'
import { VmGroup } from '@ResourcesModule'

/**
 * @param {object} root0 - Params
 * @param {boolean} root0.isOpen - Is isOpen
 * @param {object} root0.selectedVmGroup - Selected VM group
 * @param {Function} root0.handleClose - Handle close
 * @param {Array} root0.actions - Available actions
 * @returns {Component} - Single view details drawer
 */
export const SingleView = ({
  isOpen = false,
  selectedVmGroup = {},
  handleClose,
  actions,
}) => {
  const { palette } = useTheme()
  const history = useHistory()
  const { showModal } = useModalsApi()

  const selectedVmIds = [
    ...new Set(
      []
        .concat(selectedVmGroup?.ROLES?.ROLE)
        .flatMap((r) => r?.VMS?.split(',') ?? [])
        .filter(Boolean)
    ),
  ]?.join(',')

  const { data: vms = [], isFetching: isLoadingVms } = vmgroupVmTable.useData(
    { ids: selectedVmIds },
    { refetchOnMountOrArgChange: true }
  )

  const [refreshVmGroup, { isFetching: isRefreshingVmGroup }] =
    VmGroupAPI.useLazyGetVMGroupQuery()

  const [rename, { isLoading: isRenaming }] =
    VmGroupAPI.useRenameVMGroupMutation()
  const [remove, { isLoading: isRemoving }] =
    VmGroupAPI.useRemoveVMGroupMutation()
  const [lock, { isLoading: isLocking }] = VmGroupAPI.useLockVMGroupMutation()
  const [unlock, { isLoading: isUnlocking }] =
    VmGroupAPI.useUnlockVMGroupMutation()

  const [changePermissions, { isLoading: isChangingPermissions }] =
    VmGroupAPI.useChangeVMGroupPermissionsMutation()
  const [changeOwnership, { isLoading: isChangingOwnership }] =
    VmGroupAPI.useChangeVMGroupOwnershipMutation()

  const handleOpenDeleteForm = () =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title: `${T.Delete} ${T.VMGroup}`,
        description: (
          <ResourceActionConfirmation
            description={T['resource.delete.confirmation']}
            resources={selectedVmGroup}
            resourceType={T.VMGroups}
          />
        ),
        confirmLabel: T.Delete,
        confirmButtonProps: {
          isDestructive: true,
        },
      },
      onSubmit: async () => {
        await remove({ id: selectedVmGroup?.ID })
        handleClose()
      },
    })

  const handleRename = async (newName) => {
    await rename({ id: selectedVmGroup?.ID, name: newName })
  }

  const handleLock = () =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title: T.Lock,
        description: (
          <ResourceActionConfirmation
            description={T['resource.lock.confirmation']}
            resources={selectedVmGroup}
            resourceType={T.VMGroups}
          />
        ),
        confirmLabel: T.Lock,
      },
      onSubmit: async () => await lock({ id: selectedVmGroup?.ID }),
    })

  const handleUnlock = () =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title: T.Unlock,
        description: (
          <ResourceActionConfirmation
            description={T['resource.unlock.confirmation']}
            resources={selectedVmGroup}
            resourceType={T.VMGroups}
          />
        ),
        confirmLabel: T.Unlock,
      },
      onSubmit: async () => await unlock({ id: selectedVmGroup?.ID }),
    })

  const handleEdit = () => {
    history.push(PATH.TEMPLATE.VMGROUP.CREATE, selectedVmGroup)
  }

  const handleChangePermission = async (newPermission) => {
    await changePermissions({ id: selectedVmGroup?.ID, ...newPermission })
  }

  const handleChangeOwnership = async (newOwnership) => {
    await changeOwnership({ id: selectedVmGroup?.ID, ...newOwnership })
  }

  const isActionsDisabled =
    isLocking ||
    isUnlocking ||
    isRenaming ||
    isRemoving ||
    isRefreshingVmGroup ||
    isChangingOwnership ||
    isChangingPermissions

  const templateIsLocked = Object.hasOwn(selectedVmGroup, 'LOCK')

  return (
    <DetailsDrawer
      isOpen={isOpen}
      slots={[
        [
          InfoSlot,
          {
            isTitleEditable: true,
            onTitleChange: handleRename,
            isTitleEditDisabled: isRenaming,
            title: selectedVmGroup?.NAME,
            id: selectedVmGroup?.ID,
            tags: getLabelTags(selectedVmGroup?.LABELS),
            labels: [
              [T.Owner, selectedVmGroup?.UNAME],
              [T.Group, selectedVmGroup?.GNAME],
            ],
            Toolbar: () => (
              <Box
                sx={(theme) => ({
                  display: 'flex',
                  flexDirection: 'row',
                  gap: `${theme.scale[500]}px`,
                })}
              >
                <ButtonGroup
                  selected={[templateIsLocked ? 'lock' : 'unlock']}
                  buttons={[
                    {
                      startIcon: <Lock width="16px" height="16px" />,
                      onClick: handleLock,
                      value: 'lock',
                      isDisabled: isActionsDisabled,
                    },
                    {
                      startIcon: <NoLock width="16px" height="16px" />,
                      onClick: handleUnlock,
                      value: 'unlock',
                      isDisabled: isActionsDisabled,
                    },
                  ]}
                />
                <ToggleGroup
                  size="medium"
                  options={[
                    [
                      {
                        ...getLabelMenuButtonProps({
                          selectedRows: [selectedVmGroup],
                          resourceType: RESOURCE_NAMES.VM_GROUP,
                          isDisabled: isActionsDisabled,
                        }),
                      },
                      {
                        startIcon: <Edit width="16px" height="16px" />,
                        onClick: handleEdit,
                        value: 'edit',
                        isDisabled: templateIsLocked || isActionsDisabled,
                      },
                      {
                        startIcon: <RefreshDouble width="16px" height="16px" />,
                        onClick: () =>
                          refreshVmGroup({ id: selectedVmGroup?.ID }),
                        value: 'refresh',
                        isDisabled: isActionsDisabled,
                      },
                    ],

                    [
                      {
                        startIcon: (
                          <Trash
                            width="16px"
                            height="16px"
                            style={{
                              color:
                                templateIsLocked || isActionsDisabled
                                  ? palette.text.disabled
                                  : palette.icon.error,
                            }}
                          />
                        ),
                        onClick: handleOpenDeleteForm,
                        value: 'delete',
                        isDisabled: templateIsLocked || isActionsDisabled,
                      },
                      {
                        startIcon: <Cancel width="16px" height="16px" />,
                        onClick: handleClose,
                        value: 'close',
                      },
                    ],
                  ]}
                />
              </Box>
            ),
          },
        ],
        [
          SummarySlot,
          {
            labels: [
              [getVmGroupTotalRoles(selectedVmGroup), T.Roles],
              [getVmGroupTotalVms(selectedVmGroup), T.VMs],
            ]?.filter(([value]) => value !== undefined),
          },
        ],
        [
          TabSlot,
          {
            tabs: VmGroup.Tabs.Single,
            resourceId: VmGroup.RID,
            tabProps: {
              selected: selectedVmGroup,
              handleChangePermission,
              handleChangeOwnership,
              isLocked: templateIsLocked,
              vms,
              isLoadingVms,
            },
          },
        ],
      ]}
    />
  )
}

SingleView.displayName = 'SingleView'

SingleView.propTypes = {
  isOpen: PropTypes.bool,
  selectedVmGroup: PropTypes.object,
  handleClose: PropTypes.func,
  actions: PropTypes.array,
}
