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
import {
  Cancel as CloseIcon,
  Lock,
  NoLock,
  OffTag,
  OnTag,
  Trash,
} from 'iconoir-react'
import {
  MARKETPLACE_APP_ACTIONS,
  RESOURCE_NAMES,
  STYLE_BUTTONS,
  T,
  UNITS,
} from '@ConstantsModule'
import { MarketplaceAppAPI, useModalsApi } from '@FeaturesModule'
import { MarketplaceApp } from '@ResourcesModule'
import { prettyBytes, aggregateLockState } from '@UtilsModule'

/**
 * @param {object} root0 - Params
 * @param {boolean} root0.isOpen - Is open
 * @param {object[]} root0.selectedMarketplaceApps - Selected Marketplace Apps
 * @param {Function} root0.handleClose - Handle close
 * @param {Function} root0.handleSelect - Handle select
 * @param {Function} root0.handleDeselect - Handle deselect
 * @param {Array} root0.actions - Available actions
 * @returns {Component} - Aggregated view details drawer
 */
export const AggregatedView = ({
  isOpen = false,
  selectedMarketplaceApps = [],
  handleClose,
  handleSelect,
  handleDeselect,
  actions = [],
}) => {
  const { showModal } = useModalsApi()

  // API
  const [refreshMarketplaceApp, { isFetching: isRefreshingMarketplaceApp }] =
    MarketplaceAppAPI.useLazyGetMarketplaceAppQuery()
  const [remove, { isLoading: isRemoving }] =
    MarketplaceAppAPI.useDeleteAppMutation()
  const [lock, { isLoading: isLocking }] =
    MarketplaceAppAPI.useLockAppMutation()
  const [unlock, { isLoading: isUnlocking }] =
    MarketplaceAppAPI.useUnlockAppMutation()
  const [enable, { isLoading: isEnabling }] =
    MarketplaceAppAPI.useEnableAppMutation()
  const [disable, { isLoading: isDisabling }] =
    MarketplaceAppAPI.useDisableAppMutation()
  const [changePermissions, { isLoading: isChangingPermissions }] =
    MarketplaceAppAPI.useChangeAppPermissionsMutation()
  const [changeOwnership, { isLoading: isChangingOwnership }] =
    MarketplaceAppAPI.useChangeAppOwnershipMutation()

  // State
  const isMutating =
    isRefreshingMarketplaceApp ||
    isRemoving ||
    isLocking ||
    isUnlocking ||
    isEnabling ||
    isDisabling ||
    isChangingPermissions ||
    isChangingOwnership

  const { allLocked, noneLocked } = aggregateLockState(selectedMarketplaceApps)
  const allDisabled = selectedMarketplaceApps.every(({ STATE }) => +STATE === 4)
  const allEnabled = selectedMarketplaceApps.every(({ STATE }) => +STATE !== 4)
  const hasAction = (action) => !actions?.length || actions.includes(action)
  const canLock = hasAction(MARKETPLACE_APP_ACTIONS.LOCK)
  const canUnlock = hasAction(MARKETPLACE_APP_ACTIONS.UNLOCK)
  const canEnable = hasAction(MARKETPLACE_APP_ACTIONS.ENABLE)
  const canDisable = hasAction(MARKETPLACE_APP_ACTIONS.DISABLE)
  const canDelete = hasAction(MARKETPLACE_APP_ACTIONS.DELETE)

  const totalSize = useMemo(
    () =>
      selectedMarketplaceApps.reduce(
        (total, { SIZE = 0 }) => total + Number(SIZE || 0),
        0
      ),
    [selectedMarketplaceApps]
  )

  const totalByType = useMemo(
    () =>
      selectedMarketplaceApps.reduce(
        (total, { TYPE }) => ({
          ...total,
          [TYPE]: (total[TYPE] ?? 0) + 1,
        }),
        {}
      ),
    [selectedMarketplaceApps]
  )

  // Actions
  const handleRefresh = async () =>
    await Promise.all(
      selectedMarketplaceApps.map(({ ID }) => refreshMarketplaceApp({ id: ID }))
    )

  const handleLock = async () => {
    await Promise.all(selectedMarketplaceApps.map(({ ID }) => lock({ id: ID })))
    await handleRefresh()
  }

  const handleUnlock = async () => {
    await Promise.all(
      selectedMarketplaceApps.map(({ ID }) => unlock({ id: ID }))
    )
    await handleRefresh()
  }

  const handleEnable = async () => {
    await Promise.all(selectedMarketplaceApps.map(({ ID }) => enable(ID)))
    await handleRefresh()
  }

  const handleDisable = async () => {
    await Promise.all(selectedMarketplaceApps.map(({ ID }) => disable(ID)))
    await handleRefresh()
  }

  const handleChangePermission = async (newPermission) => {
    await Promise.all(
      selectedMarketplaceApps.map(({ ID }) =>
        changePermissions({ id: ID, ...newPermission })
      )
    )

    await handleRefresh()
  }

  const handleChangeOwnership = async (newOwnership) => {
    await Promise.all(
      selectedMarketplaceApps.map(({ ID }) =>
        changeOwnership({ id: ID, ...newOwnership })
      )
    )

    await handleRefresh()
  }

  // Modals
  const handleEnableForm = () =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title: `${T.Enable} ${T.Apps}`,
        description: (
          <ResourceActionConfirmation
            description={T['resource.enable.confirmation']}
            resources={selectedMarketplaceApps}
            resourceType={T.Apps}
          />
        ),
        confirmLabel: T.Enable,
      },
      onSubmit: handleEnable,
    })

  const handleDisableForm = () =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title: `${T.Disable} ${T.Apps}`,
        description: (
          <ResourceActionConfirmation
            description={T['resource.disable.confirmation']}
            resources={selectedMarketplaceApps}
            resourceType={T.Apps}
          />
        ),
        confirmLabel: T.Disable,
      },
      onSubmit: handleDisable,
    })

  const handleLockForm = () =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title: `${T.Lock} ${T.Apps}`,
        description: (
          <ResourceActionConfirmation
            description={T['resource.lock.confirmation']}
            resources={selectedMarketplaceApps}
            resourceType={T.Apps}
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
        title: `${T.Unlock} ${T.Apps}`,
        description: (
          <ResourceActionConfirmation
            description={T['resource.unlock.confirmation']}
            resources={selectedMarketplaceApps}
            resourceType={T.Apps}
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
        title: `${T.Delete} ${T.Apps}`,
        description: (
          <ResourceActionConfirmation
            description={T['resource.delete.confirmation']}
            resources={selectedMarketplaceApps}
            resourceType={T.Apps}
          />
        ),
        confirmLabel: T.Delete,
        confirmButtonProps: {
          isDestructive: true,
        },
      },
      onSubmit: async () => {
        await Promise.all(
          selectedMarketplaceApps.map(({ ID }) => remove({ id: ID }))
        )
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
            title: `${selectedMarketplaceApps?.length} ${T.Apps} ${T.Selected}`,
            Toolbar: () => (
              <Box
                sx={(theme) => ({
                  display: 'flex',
                  flexDirection: 'row',
                  gap: `${theme.scale[500]}px`,
                })}
              >
                {(canEnable || canDisable) && (
                  <ButtonGroup
                    selected={
                      allEnabled ? ['enable'] : allDisabled ? ['disable'] : []
                    }
                    buttons={[
                      canEnable && {
                        startIcon: <OnTag width="16px" height="16px" />,
                        onClick: handleEnableForm,
                        value: 'enable',
                        tooltip: T.Enable,
                        isDisabled: isMutating,
                      },
                      canDisable && {
                        startIcon: <OffTag width="16px" height="16px" />,
                        onClick: handleDisableForm,
                        value: 'disable',
                        tooltip: T.Disable,
                        isDisabled: isMutating,
                      },
                    ].filter(Boolean)}
                  />
                )}
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
                  selectedRows={selectedMarketplaceApps}
                  resourceType={RESOURCE_NAMES.APP}
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
              [selectedMarketplaceApps?.length, T.Apps],
              [prettyBytes(totalSize, UNITS.MB), T.Size],
              [Object.keys(totalByType).length, T.Type],
            ],
          },
        ],
        [
          TabSlot,
          {
            tabs: MarketplaceApp.Tabs.Aggregated,
            resourceId: MarketplaceApp.RID,
            tabProps: {
              selected: selectedMarketplaceApps,
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
  selectedMarketplaceApps: PropTypes.array,
  handleClose: PropTypes.func,
  handleSelect: PropTypes.func,
  handleDeselect: PropTypes.func,
  actions: PropTypes.array,
}
