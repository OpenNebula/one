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
  Button,
  ButtonGroup,
  DetailsDrawer,
  InfoSlot,
  LabelButton,
  ResourceActionConfirmation,
  SummarySlot,
  TabSlot,
} from '@ComponentsV2Module'
import { Box } from '@mui/material'
import { Component, useMemo } from 'react'
import PropTypes from 'prop-types'
import { Cancel as CloseIcon, Lock, NoLock, Trash } from 'iconoir-react'
import {
  RESOURCE_NAMES,
  STYLE_BUTTONS,
  T,
  VROUTER_ACTIONS,
} from '@ConstantsModule'
import { useModalsApi, VrAPI } from '@FeaturesModule'
import { aggregateLockState } from '@UtilsModule'
import {
  getVirtualRouterTotalNics,
  getVirtualRouterTotalVms,
} from '@ModelsModule'
import { VirtualRouter } from '@ResourcesModule'

/**
 * @param {object} root0 - Params
 * @param {boolean} root0.isOpen - Is open
 * @param {object[]} root0.selectedVRouters - Selected Virtual Routers
 * @param {Function} root0.handleClose - Handle close
 * @param {Function} root0.handleSelect - Handle select
 * @param {Function} root0.handleDeselect - Handle deselect
 * @param {Array} root0.actions - Available actions
 * @returns {Component} - Aggregated view details drawer
 */
export const AggregatedView = ({
  isOpen = false,
  selectedVRouters = [],
  handleClose,
  handleSelect,
  handleDeselect,
  actions = [],
}) => {
  const { showModal } = useModalsApi()

  // API
  const [refreshVRouter, { isFetching: isRefreshingVRouter }] =
    VrAPI.useLazyGetVrQuery()
  const [remove, { isLoading: isRemoving }] = VrAPI.useDeleteVrMutation()
  const [lock, { isLoading: isLocking }] = VrAPI.useLockVrMutation()
  const [unlock, { isLoading: isUnlocking }] = VrAPI.useUnlockVrMutation()
  const [changePermissions, { isLoading: isChangingPermissions }] =
    VrAPI.useChangeVrPermissionsMutation()
  const [changeOwnership, { isLoading: isChangingOwnership }] =
    VrAPI.useChangeVrOwnershipMutation()

  // State
  const hasAction = (action) => !actions?.length || actions.includes(action)
  const canDelete = hasAction(VROUTER_ACTIONS.DELETE)
  const canLock = hasAction(VROUTER_ACTIONS.LOCK)
  const canUnlock = hasAction(VROUTER_ACTIONS.UNLOCK)

  const isMutating =
    isRefreshingVRouter ||
    isRemoving ||
    isLocking ||
    isUnlocking ||
    isChangingPermissions ||
    isChangingOwnership

  const { allLocked, noneLocked } = aggregateLockState(selectedVRouters)

  const summary = useMemo(
    () => ({
      vms: selectedVRouters.reduce(
        (total, vrouter) => total + getVirtualRouterTotalVms(vrouter),
        0
      ),
      nics: selectedVRouters.reduce(
        (total, vrouter) => total + getVirtualRouterTotalNics(vrouter),
        0
      ),
    }),
    [selectedVRouters]
  )

  // Actions
  const handleRefresh = async () =>
    await Promise.all(
      selectedVRouters.map(({ ID }) => refreshVRouter({ id: ID }))
    )

  const handleLock = async () => {
    await Promise.all(selectedVRouters.map(({ ID }) => lock({ id: ID })))
    await handleRefresh()
  }

  const handleUnlock = async () => {
    await Promise.all(selectedVRouters.map(({ ID }) => unlock({ id: ID })))
    await handleRefresh()
  }

  const handleChangePermission = async (newPermission) => {
    await Promise.all(
      selectedVRouters.map(({ ID }) =>
        changePermissions({ id: ID, ...newPermission })
      )
    )
    await handleRefresh()
  }

  const handleChangeOwnership = async (newOwnership) => {
    await Promise.all(
      selectedVRouters.map(({ ID }) =>
        changeOwnership({ id: ID, ...newOwnership })
      )
    )
    await handleRefresh()
  }

  // Modals
  const handleLockForm = () =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title: `${T.Lock} ${T.VirtualRouters}`,
        description: (
          <ResourceActionConfirmation
            description={T['resource.lock.confirmation']}
            resources={selectedVRouters}
            resourceType={T.VirtualRouters}
          />
        ),
        confirmLabel: T.Lock,
      },
      onSubmit: handleLock,
    })

  const handleUnlockForm = () =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title: `${T.Unlock} ${T.VirtualRouters}`,
        description: (
          <ResourceActionConfirmation
            description={T['resource.unlock.confirmation']}
            resources={selectedVRouters}
            resourceType={T.VirtualRouters}
          />
        ),
        confirmLabel: T.Unlock,
      },
      onSubmit: handleUnlock,
    })

  const handleDeleteForm = () =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title: `${T.Delete} ${T.VirtualRouters}`,
        description: (
          <ResourceActionConfirmation
            description={T['resource.delete.confirmation']}
            resources={selectedVRouters}
            resourceType={T.VirtualRouters}
          />
        ),
        confirmLabel: T.Delete,
        confirmButtonProps: {
          isDestructive: true,
        },
      },
      onSubmit: async () => {
        await Promise.all(selectedVRouters.map(({ ID }) => remove({ id: ID })))
        handleClose()
      },
    })

  return (
    <DetailsDrawer
      isOpen={isOpen}
      slots={[
        [
          InfoSlot,
          {
            title: `${selectedVRouters?.length} ${T.VirtualRouters} ${T.Selected}`,
            Toolbar: () => (
              <Box
                sx={(theme) => ({
                  display: 'flex',
                  flexDirection: 'row',
                  gap: `${theme.scale[500]}px`,
                })}
              >
                {(canLock || canUnlock) && (
                  <ButtonGroup
                    selected={
                      allLocked ? ['lock'] : noneLocked ? ['unlock'] : []
                    }
                    buttons={[
                      canLock && {
                        startIcon: <Lock width="16px" height="16px" />,
                        onClick: handleLockForm,
                        value: 'lock',
                        tooltip: T.Lock,
                        isDisabled: isMutating,
                      },
                      canUnlock && {
                        startIcon: <NoLock width="16px" height="16px" />,
                        onClick: handleUnlockForm,
                        value: 'unlock',
                        tooltip: T.Unlock,
                        isDisabled: isMutating,
                      },
                    ].filter(Boolean)}
                  />
                )}

                <LabelButton
                  selectedRows={selectedVRouters}
                  resourceType={RESOURCE_NAMES.VROUTER}
                  isDisabled={isMutating}
                />
                {canDelete && (
                  <Button
                    type={STYLE_BUTTONS.TYPE.PRIMARY}
                    size="small"
                    startIcon={<Trash width={'16px'} height={'16px'} />}
                    onClick={handleDeleteForm}
                    isDestructive
                    isDisabled={!noneLocked || isMutating}
                  >
                    {T.DeleteSelected}
                  </Button>
                )}

                <Button
                  type={STYLE_BUTTONS.TYPE.TRANSPARENT}
                  size="small"
                  iconOnly={<CloseIcon width={'16px'} height={'16px'} />}
                  tooltip={T.Close}
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
              [summary.vms, T.TotalVms],
              [summary.nics, T.NIC],
            ],
          },
        ],
        [
          TabSlot,
          {
            tabs: VirtualRouter.Tabs.Aggregated,
            resourceId: VirtualRouter.RID,
            tabProps: {
              selected: selectedVRouters,
              handleChangePermission,
              handleChangeOwnership,
              handleSelect,
              handleDeselect,
              isActionsDisabled: isMutating,
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
  selectedVRouters: PropTypes.array,
  handleClose: PropTypes.func,
  handleSelect: PropTypes.func,
  handleDeselect: PropTypes.func,
  actions: PropTypes.array,
}
