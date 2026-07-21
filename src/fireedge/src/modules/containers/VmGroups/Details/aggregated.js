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
  InfoSlot,
  LabelButton,
  SummarySlot,
  TabSlot,
  ButtonGroup,
  Button,
  ResourceActionConfirmation,
} from '@ComponentsV2Module'
import { useModalsApi, VmGroupAPI } from '@FeaturesModule'
import { Component, useMemo } from 'react'
import { aggregateLockState } from '@UtilsModule'
import { RESOURCE_NAMES, T, STYLE_BUTTONS } from '@ConstantsModule'
import { Box } from '@mui/material'
import PropTypes from 'prop-types'
import { Lock, NoLock, Trash, Cancel as CloseIcon } from 'iconoir-react'
import { VmGroup } from '@ResourcesModule'
import { getVmGroupTotalRoles, getVmGroupTotalVms } from '@ModelsModule'

/**
 * @param {object} root0 - Params
 * @param {boolean} root0.isOpen - Is isOpen
 * @param {object} root0.selectedVmGroups - Selected VM group
 * @param {Function} root0.handleClose - Handle close
 * @param {Function} root0.handleSelect - Handle select
 * @param {Function} root0.handleDeselect - Handle deselect
 * @param {Array} root0.actions - Available actions
 * @returns {Component} - Single view details drawer
 */
export const AggregatedView = ({
  isOpen = false,
  selectedVmGroups = [],
  handleClose,
  handleSelect,
  handleDeselect,
  actions,
}) => {
  const { showModal } = useModalsApi()

  const [refreshVmGroup, { isFetching: isRefreshingVmGroup }] =
    VmGroupAPI.useLazyGetVMGroupQuery()

  const [remove, { isLoading: isRemoving }] =
    VmGroupAPI.useRemoveVMGroupMutation()
  const [lock, { isLoading: isLocking }] = VmGroupAPI.useLockVMGroupMutation()
  const [unlock, { isLoading: isUnlocking }] =
    VmGroupAPI.useUnlockVMGroupMutation()

  const [changePermissions, { isLoading: isChangingPermissions }] =
    VmGroupAPI.useChangeVMGroupPermissionsMutation()
  const [changeOwnership, { isLoading: isChangingOwnership }] =
    VmGroupAPI.useChangeVMGroupOwnershipMutation()

  const handleRefresh = async () =>
    await Promise.all(
      selectedVmGroups.map(({ ID }) => refreshVmGroup({ id: ID }))
    )

  const handleLock = () =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title: T.Lock,
        description: (
          <ResourceActionConfirmation
            description={T['resource.lock.confirmation']}
            resources={selectedVmGroups}
            resourceType={T.VMGroups}
          />
        ),
        confirmLabel: T.Lock,
      },
      onSubmit: async () => {
        await Promise.all(selectedVmGroups.map(({ ID }) => lock({ id: ID })))
        await handleRefresh()
      },
    })

  const handleUnlock = () =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title: T.Unlock,
        description: (
          <ResourceActionConfirmation
            description={T['resource.unlock.confirmation']}
            resources={selectedVmGroups}
            resourceType={T.VMGroups}
          />
        ),
        confirmLabel: T.Unlock,
      },
      onSubmit: async () => {
        await Promise.all(selectedVmGroups.map(({ ID }) => unlock({ id: ID })))
        await handleRefresh()
      },
    })

  const handleChangePermission = async (newPermission) => {
    await Promise.all(
      selectedVmGroups.map(({ ID }) =>
        changePermissions({ id: ID, ...newPermission })
      )
    )

    await handleRefresh()
  }

  const handleChangeOwnership = async (newOwnership) => {
    await Promise.all(
      selectedVmGroups.map(({ ID }) =>
        changeOwnership({ id: ID, ...newOwnership })
      )
    )

    await handleRefresh()
  }

  const handleOpenDeleteForm = () =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title: `${T.Delete} ${T.VMGroup}`,
        description: (
          <ResourceActionConfirmation
            description={T['resource.delete.confirmation']}
            resources={selectedVmGroups}
            resourceType={T.VMGroups}
          />
        ),
        confirmLabel: T.Delete,
        confirmButtonProps: {
          isDestructive: true,
        },
      },
      onSubmit: async () => {
        await Promise.all(selectedVmGroups.map(({ ID }) => remove({ id: ID })))
        handleClose()
      },
    })

  const isMutating =
    isLocking ||
    isUnlocking ||
    isRemoving ||
    isRefreshingVmGroup ||
    isChangingOwnership ||
    isChangingPermissions

  const { allLocked, noneLocked } = aggregateLockState(selectedVmGroups)

  const { totalRoles, totalVms } = useMemo(
    () =>
      [].concat(selectedVmGroups).reduce(
        (totals, vmGroup) => ({
          totalRoles: totals.totalRoles + getVmGroupTotalRoles(vmGroup),
          totalVms: totals.totalVms + getVmGroupTotalVms(vmGroup),
        }),
        { totalRoles: 0, totalVms: 0 }
      ),
    [selectedVmGroups]
  )

  return (
    <DetailsDrawer
      isOpen={isOpen}
      slots={[
        [
          InfoSlot,
          {
            title: `${selectedVmGroups?.length} ${T.VMTemplates} ${T.Selected}`,
            Toolbar: () => (
              <Box
                sx={(theme) => ({
                  display: 'flex',
                  flexDirection: 'row',
                  gap: `${theme.scale[500]}px`,
                })}
              >
                <ButtonGroup
                  selected={allLocked ? ['lock'] : noneLocked ? ['unlock'] : []}
                  buttons={[
                    {
                      startIcon: <Lock width="16px" height="16px" />,
                      onClick: handleLock,
                      value: 'lock',
                      isDisabled: isMutating,
                    },
                    {
                      startIcon: <NoLock width="16px" height="16px" />,
                      onClick: handleUnlock,
                      value: 'unlock',
                      isDisabled: isMutating,
                    },
                  ]}
                />

                <LabelButton
                  selectedRows={selectedVmGroups}
                  resourceType={RESOURCE_NAMES.VM_GROUP}
                  isDisabled={isMutating}
                />
                <Button
                  type={STYLE_BUTTONS.TYPE.PRIMARY}
                  size="small"
                  startIcon={<Trash width={'16px'} height={'16px'} />}
                  onClick={handleOpenDeleteForm}
                  isDestructive
                  isDisabled={!noneLocked || isMutating}
                >
                  {T.DeleteSelected}
                </Button>

                <Button
                  type={STYLE_BUTTONS.TYPE.TRANSPARENT}
                  size="small"
                  iconOnly={<CloseIcon width={'16px'} height={'16px'} />}
                  onClick={handleClose}
                />
              </Box>
            ),
          },
        ],
        [
          SummarySlot,
          {
            labels: [
              [totalRoles, T.Roles],
              [totalVms, T.VMs],
            ]?.filter(([value]) => value !== undefined),
          },
        ],
        [
          TabSlot,
          {
            tabs: VmGroup.Tabs.Aggregated,
            resourceId: VmGroup.RID,
            tabProps: {
              selected: selectedVmGroups,
              handleChangePermission,
              handleChangeOwnership,
              handleSelect,
              handleDeselect,
              isLocked: !noneLocked,
            },
          },
        ],
      ]}
    />
  )
}

AggregatedView.displayName = 'AggregatedView'

AggregatedView.propTypes = {
  isOpen: PropTypes.bool,
  selectedVmGroups: PropTypes.array,
  handleClose: PropTypes.func,
  handleSelect: PropTypes.func,
  handleDeselect: PropTypes.func,
  actions: PropTypes.array,
}
