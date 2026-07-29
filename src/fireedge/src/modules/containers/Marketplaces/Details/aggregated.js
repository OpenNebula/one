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
import { Cancel as CloseIcon, OffTag, OnTag, Trash } from 'iconoir-react'
import {
  MARKETPLACE_ACTIONS,
  RESOURCE_NAMES,
  STYLE_BUTTONS,
  T,
  UNITS,
} from '@ConstantsModule'
import { MarketplaceAPI, useModalsApi } from '@FeaturesModule'
import { Marketplace } from '@ResourcesModule'
import {
  aggregateMetrics,
  getTotalOfResources,
  prettyBytes,
} from '@UtilsModule'

/**
 * @param {object} root0 - Params
 * @param {boolean} root0.isOpen - Is open
 * @param {object[]} root0.selectedMarketplaces - Selected Marketplaces
 * @param {Function} root0.handleClose - Handle close
 * @param {Function} root0.handleSelect - Handle select
 * @param {Function} root0.handleDeselect - Handle deselect
 * @param {Array} root0.actions - Available actions
 * @returns {Component} - Aggregated view details drawer
 */
export const AggregatedView = ({
  isOpen = false,
  selectedMarketplaces = [],
  handleClose,
  handleSelect,
  handleDeselect,
  actions = [],
}) => {
  const { showModal } = useModalsApi()

  // API
  const [refreshMarketplace, { isFetching: isRefreshingMarketplace }] =
    MarketplaceAPI.useLazyGetMarketplaceQuery()
  const [remove, { isLoading: isRemoving }] =
    MarketplaceAPI.useRemoveMarketplaceMutation()
  const [enable, { isLoading: isEnabling }] =
    MarketplaceAPI.useEnableMarketplaceMutation()
  const [disable, { isLoading: isDisabling }] =
    MarketplaceAPI.useDisableMarketplaceMutation()
  const [changePermissions, { isLoading: isChangingPermissions }] =
    MarketplaceAPI.useChangeMarketplacePermissionsMutation()
  const [changeOwnership, { isLoading: isChangingOwnership }] =
    MarketplaceAPI.useChangeMarketplaceOwnershipMutation()

  // State
  const isMutating =
    isRefreshingMarketplace ||
    isRemoving ||
    isEnabling ||
    isDisabling ||
    isChangingPermissions ||
    isChangingOwnership

  const allEnabled = selectedMarketplaces.every(({ STATE }) => +STATE === 0)
  const allDisabled = selectedMarketplaces.every(({ STATE }) => +STATE === 1)
  const hasAction = (action) => !actions?.length || actions.includes(action)
  const canEnable = hasAction(MARKETPLACE_ACTIONS.ENABLE)
  const canDisable = hasAction(MARKETPLACE_ACTIONS.DISABLE)
  const canDelete = hasAction(MARKETPLACE_ACTIONS.DELETE)

  const aggregatedMetrics = useMemo(
    () => aggregateMetrics(selectedMarketplaces, ['TOTAL_MB', 'USED_MB']),
    [selectedMarketplaces]
  )

  const totalApps = useMemo(
    () =>
      selectedMarketplaces.reduce(
        (total, marketplace) =>
          total + getTotalOfResources(marketplace?.MARKETPLACEAPPS),
        0
      ),
    [selectedMarketplaces]
  )

  // Actions
  const handleRefresh = async () =>
    await Promise.all(
      selectedMarketplaces.map(({ ID }) => refreshMarketplace({ id: ID }))
    )

  const handleEnable = async () => {
    await Promise.all(selectedMarketplaces.map(({ ID }) => enable({ id: ID })))
    await handleRefresh()
  }

  const handleDisable = async () => {
    await Promise.all(selectedMarketplaces.map(({ ID }) => disable({ id: ID })))
    await handleRefresh()
  }

  const handleChangePermission = async (newPermission) => {
    await Promise.all(
      selectedMarketplaces.map(({ ID }) =>
        changePermissions({ id: ID, ...newPermission })
      )
    )

    await handleRefresh()
  }

  const handleChangeOwnership = async (newOwnership) => {
    await Promise.all(
      selectedMarketplaces.map(({ ID }) =>
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
        title: `${T.Enable} ${T.Marketplaces}`,
        description: (
          <ResourceActionConfirmation
            description={T['resource.enable.confirmation']}
            resources={selectedMarketplaces}
            resourceType={T.Marketplaces}
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
        title: `${T.Disable} ${T.Marketplaces}`,
        description: (
          <ResourceActionConfirmation
            description={T['resource.disable.confirmation']}
            resources={selectedMarketplaces}
            resourceType={T.Marketplaces}
          />
        ),
        confirmLabel: T.Disable,
      },
      onSubmit: handleDisable,
    })

  const handleDeleteForm = () =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title: `${T.Delete} ${T.Marketplaces}`,
        description: (
          <ResourceActionConfirmation
            description={T['resource.delete.confirmation']}
            resources={selectedMarketplaces}
            resourceType={T.Marketplaces}
          />
        ),
        confirmLabel: T.Delete,
        confirmButtonProps: {
          isDestructive: true,
        },
      },
      onSubmit: async () => {
        await Promise.all(
          selectedMarketplaces.map(({ ID }) => remove({ id: ID }))
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
            title: `${selectedMarketplaces?.length} ${T.Marketplaces} ${T.Selected}`,
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

                <LabelButton
                  selectedRows={selectedMarketplaces}
                  resourceType={RESOURCE_NAMES.MARKETPLACE}
                  isDisabled={isMutating}
                />
                {canDelete && (
                  <Button
                    type={STYLE_BUTTONS.TYPE.PRIMARY}
                    size="small"
                    startIcon={<Trash width={'16px'} height={'16px'} />}
                    onClick={handleDeleteForm}
                    isDestructive
                    isDisabled={isMutating}
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
              [totalApps, T.Apps],
              [prettyBytes(aggregatedMetrics?.TOTAL_MB, UNITS.MB), T.Capacity],
              [prettyBytes(aggregatedMetrics?.USED_MB, UNITS.MB), T.Used],
            ],
          },
        ],
        [
          TabSlot,
          {
            tabs: Marketplace.Tabs.Aggregated,
            resourceId: Marketplace.RID,
            tabProps: {
              selected: selectedMarketplaces,
              handleChangePermission,
              handleChangeOwnership,
              handleSelect,
              handleDeselect,
              isActionsDisabled: isMutating,
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
  selectedMarketplaces: PropTypes.array,
  handleClose: PropTypes.func,
  handleSelect: PropTypes.func,
  handleDeselect: PropTypes.func,
  actions: PropTypes.array,
}
