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
import { RESOURCE_NAMES, STYLE_BUTTONS, T, VN_ACTIONS } from '@ConstantsModule'
import { VnAPI, useModalsApi } from '@FeaturesModule'
import { aggregateLockState, aggregateMetrics } from '@UtilsModule'
import { VirtualNetwork } from '@ResourcesModule'

/**
 * @param {object} root0 - Params
 * @param {boolean} root0.isOpen - Is open
 * @param {object[]} root0.selectedVnets - Selected Virtual Networks
 * @param {Function} root0.handleClose - Handle close
 * @param {Function} root0.handleSelect - Handle select
 * @param {Function} root0.handleDeselect - Handle deselect
 * @param {Array} root0.actions - Available actions
 * @returns {Component} - Aggregated view details drawer
 */
export const AggregatedView = ({
  isOpen = false,
  selectedVnets = [],
  handleClose,
  handleSelect,
  handleDeselect,
  actions = [],
}) => {
  const { showModal } = useModalsApi()

  // API
  const [refreshVNet, { isFetching: isRefreshingVNet }] =
    VnAPI.useLazyGetVNetworkQuery()
  const [remove, { isLoading: isRemoving }] = VnAPI.useRemoveVNetMutation()
  const [lock, { isLoading: isLocking }] = VnAPI.useLockVNetMutation()
  const [unlock, { isLoading: isUnlocking }] = VnAPI.useUnlockVNetMutation()
  const [changePermissions, { isLoading: isChangingPermissions }] =
    VnAPI.useChangeVNetPermissionsMutation()
  const [changeOwnership, { isLoading: isChangingOwnership }] =
    VnAPI.useChangeVNetOwnershipMutation()

  // State
  const hasAction = (action) => !actions?.length || actions.includes(action)
  const canDelete = hasAction(VN_ACTIONS.DELETE)
  const canLock = hasAction(VN_ACTIONS.LOCK)
  const canUnlock = hasAction(VN_ACTIONS.UNLOCK)

  const isMutating =
    isRefreshingVNet ||
    isRemoving ||
    isLocking ||
    isUnlocking ||
    isChangingPermissions ||
    isChangingOwnership

  const { allLocked, noneLocked } = aggregateLockState(selectedVnets)

  const aggregatedMetrics = useMemo(
    () => aggregateMetrics(selectedVnets, ['USED_LEASES']),
    [selectedVnets]
  )

  const addressRanges = useMemo(
    () =>
      selectedVnets.reduce(
        (total, vnet) => total + [vnet?.AR_POOL?.AR ?? []].flat().length,
        0
      ),
    [selectedVnets]
  )

  // Actions
  const handleRefresh = async () =>
    await Promise.all(selectedVnets.map(({ ID }) => refreshVNet({ id: ID })))

  const handleLock = async () => {
    await Promise.all(selectedVnets.map(({ ID }) => lock({ id: ID })))
    await handleRefresh()
  }

  const handleUnlock = async () => {
    await Promise.all(selectedVnets.map(({ ID }) => unlock({ id: ID })))
    await handleRefresh()
  }

  const handleChangePermission = async (newPermission) => {
    await Promise.all(
      selectedVnets.map(({ ID }) =>
        changePermissions({ id: ID, ...newPermission })
      )
    )

    await handleRefresh()
  }

  const handleChangeOwnership = async (newOwnership) => {
    await Promise.all(
      selectedVnets.map(({ ID }) =>
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
        title: `${T.Lock} ${T.VirtualNetworks}`,
        description: (
          <ResourceActionConfirmation
            description={T['resource.lock.confirmation']}
            resources={selectedVnets}
            resourceType={T.VirtualNetworks}
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
        title: `${T.Unlock} ${T.VirtualNetworks}`,
        description: (
          <ResourceActionConfirmation
            description={T['resource.unlock.confirmation']}
            resources={selectedVnets}
            resourceType={T.VirtualNetworks}
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
        title: `${T.Delete} ${T.VirtualNetworks}`,
        description: (
          <ResourceActionConfirmation
            description={T['resource.delete.confirmation']}
            resources={selectedVnets}
            resourceType={T.VirtualNetworks}
          />
        ),
        confirmLabel: T.Delete,
        confirmButtonProps: {
          isDestructive: true,
        },
      },
      onSubmit: async () => {
        await Promise.all(selectedVnets.map(({ ID }) => remove({ id: ID })))
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
            title: `${selectedVnets?.length} Virtual Networks ${T.Selected}`,
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
                  selectedRows={selectedVnets}
                  resourceType={RESOURCE_NAMES.VNET}
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
              [aggregatedMetrics?.USED_LEASES || 0, T.UsedLeases],
              [addressRanges, T.AddressRanges],
            ],
          },
        ],
        [
          TabSlot,
          {
            tabs: VirtualNetwork.Tabs.Aggregated,
            resourceId: VirtualNetwork.RID,
            tabProps: {
              selected: selectedVnets,
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
  selectedVnets: PropTypes.array,
  handleClose: PropTypes.func,
  handleSelect: PropTypes.func,
  handleDeselect: PropTypes.func,
  actions: PropTypes.array,
}
