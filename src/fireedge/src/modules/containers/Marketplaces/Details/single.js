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
  ButtonGroup,
  DetailsDrawer,
  getLabelMenuButtonProps,
  InfoSlot,
  ResourceActionConfirmation,
  SummarySlot,
  StatusTag,
  TabSlot,
  Tag,
  ToggleGroup,
} from '@ComponentsV2Module'
import { Box, useTheme } from '@mui/material'
import { Component, useMemo } from 'react'
import PropTypes from 'prop-types'
import {
  Cancel,
  Edit,
  OffTag,
  OnTag,
  RefreshDouble,
  Trash,
} from 'iconoir-react'
import { MARKETPLACE_ACTIONS, PATH, RESOURCE_NAMES, T } from '@ConstantsModule'
import { MarketplaceAPI, useModalsApi, useViews } from '@FeaturesModule'
import {
  getLabelTags,
  getMarketplaceCapacityInfo,
  getMarketplaceState,
} from '@ModelsModule'
import { filterAttributes, getActionsAvailable, jsonToXml } from '@UtilsModule'
import { Marketplace } from '@ResourcesModule'
import { useHistory } from 'react-router'

const HIDDEN_ATTRIBUTES_REG = /^(MARKET_MAD)$/

/**
 * @param {object} root0 - Params
 * @param {boolean} root0.isOpen - Is open
 * @param {object} root0.selectedMarketplace - Selected Marketplace
 * @param {Function} root0.handleClose - Handle close
 * @param {Array} root0.actions - Available actions
 * @returns {Component} - Single view details drawer
 */
export const SingleView = ({
  isOpen = false,
  selectedMarketplace = {},
  handleClose,
  actions = [],
}) => {
  const { palette } = useTheme()
  const { getResourceView } = useViews()
  const { showModal } = useModalsApi()
  const history = useHistory()

  // API
  const { data: fetchedMarketplace = {}, isFetching: isLoadingMarketplace } =
    MarketplaceAPI.useGetMarketplaceQuery(
      { id: selectedMarketplace?.ID },
      {
        skip: !selectedMarketplace?.ID,
        refetchOnMountOrArgChange: true,
      }
    )

  const [refreshMarketplace, { isFetching: isRefreshingMarketplace }] =
    MarketplaceAPI.useLazyGetMarketplaceQuery()
  const [rename, { isLoading: isRenaming }] =
    MarketplaceAPI.useRenameMarketplaceMutation()
  const [changeOwnership, { isLoading: isChangingOwnership }] =
    MarketplaceAPI.useChangeMarketplaceOwnershipMutation()
  const [changePermissions, { isLoading: isChangingPermissions }] =
    MarketplaceAPI.useChangeMarketplacePermissionsMutation()
  const [update, { isLoading: isUpdating }] =
    MarketplaceAPI.useUpdateMarketplaceMutation()
  const [remove, { isLoading: isRemoving }] =
    MarketplaceAPI.useRemoveMarketplaceMutation()
  const [enable, { isLoading: isEnabling }] =
    MarketplaceAPI.useEnableMarketplaceMutation()
  const [disable, { isLoading: isDisabling }] =
    MarketplaceAPI.useDisableMarketplaceMutation()

  // State
  const marketplace =
    String(fetchedMarketplace?.ID) === String(selectedMarketplace?.ID)
      ? fetchedMarketplace
      : selectedMarketplace

  const { color: stateColor, name: stateName } =
    getMarketplaceState(marketplace) ?? {}
  const { percentLabel } = getMarketplaceCapacityInfo(marketplace)
  const apps = [marketplace?.MARKETPLACEAPPS?.ID ?? []].flat().length || 0

  const infoActions = getResourceView(RESOURCE_NAMES.MARKETPLACE)?.['info-tabs']
    ?.info?.information_panel?.actions
  const canRename = getActionsAvailable(infoActions).includes(
    MARKETPLACE_ACTIONS.RENAME
  )
  const hasAction = (action) => !actions?.length || actions.includes(action)
  const canEnable = hasAction(MARKETPLACE_ACTIONS.ENABLE)
  const canDisable = hasAction(MARKETPLACE_ACTIONS.DISABLE)
  const canUpdate = hasAction(MARKETPLACE_ACTIONS.UPDATE_DIALOG)
  const canDelete = hasAction(MARKETPLACE_ACTIONS.DELETE)

  const attributes = useMemo(() => {
    const { attributes: visibleAttributes = {} } = filterAttributes(
      marketplace?.TEMPLATE,
      { hidden: HIDDEN_ATTRIBUTES_REG }
    )

    return Object.entries(visibleAttributes).map(([key, value]) => ({
      key,
      rawValue: value,
      value: value && typeof value === 'object' ? JSON.stringify(value) : value,
    }))
  }, [marketplace?.TEMPLATE])

  const isActionsDisabled =
    isLoadingMarketplace ||
    isRefreshingMarketplace ||
    isRenaming ||
    isChangingOwnership ||
    isChangingPermissions ||
    isUpdating ||
    isRemoving ||
    isEnabling ||
    isDisabling

  const isEnabled = +marketplace?.STATE === 0
  const isDisabled = +marketplace?.STATE === 1

  // Actions
  const handleRefresh = async () =>
    marketplace?.ID && (await refreshMarketplace({ id: marketplace.ID }))

  const handleEnable = async () => {
    await enable({ id: marketplace?.ID })
    await handleRefresh()
  }

  const handleDisable = async () => {
    await disable({ id: marketplace?.ID })
    await handleRefresh()
  }

  const handleRename = async (newName) => {
    await rename({ id: marketplace?.ID, name: newName })
    await handleRefresh()
  }

  const handleChangePermission = async (newPermission) => {
    await changePermissions({ id: marketplace?.ID, ...newPermission })
    await handleRefresh()
  }

  const handleChangeOwnership = async (newOwnership) => {
    await changeOwnership({ id: marketplace?.ID, ...newOwnership })
    await handleRefresh()
  }

  const handleDeleteAttribute = async (index) => {
    await updateTemplate(
      attributes.filter((_, attrIndex) => attrIndex !== index)
    )
  }

  const handleAddAttribute = async (newAttribute) => {
    await updateTemplate([newAttribute, ...attributes])
  }

  // Modals
  const handleEnableForm = () =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title: `${T.Enable} ${T.Marketplace}`,
        dataCy: `modal-${MARKETPLACE_ACTIONS.ENABLE}`,
        description: (
          <ResourceActionConfirmation
            description={T['resource.enable.confirmation']}
            resources={marketplace}
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
        title: `${T.Disable} ${T.Marketplace}`,
        dataCy: `modal-${MARKETPLACE_ACTIONS.DISABLE}`,
        description: (
          <ResourceActionConfirmation
            description={T['resource.disable.confirmation']}
            resources={marketplace}
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
        title: `${T.Delete} ${T.Marketplace}`,
        dataCy: `modal-${MARKETPLACE_ACTIONS.DELETE}`,
        description: (
          <ResourceActionConfirmation
            description={T['resource.delete.confirmation']}
            resources={marketplace}
            resourceType={T.Marketplaces}
          />
        ),
        confirmLabel: T.Delete,
        confirmButtonProps: {
          isDestructive: true,
        },
      },
      onSubmit: async () => {
        await remove({ id: marketplace?.ID })
        handleClose()
      },
    })

  // Helpers
  const handleUpdate = () => {
    history.push(PATH.STORAGE.MARKETPLACES.CREATE, marketplace)
  }

  const updateTemplate = async (nextAttributes) => {
    const nextTemplate = { ...(marketplace?.TEMPLATE ?? {}) }
    attributes.forEach(({ key }) => {
      delete nextTemplate[key]
    })
    nextAttributes.forEach(({ key, rawValue, value }) => {
      nextTemplate[key] = rawValue ?? value
    })

    await update({
      id: marketplace?.ID,
      template: jsonToXml(nextTemplate),
      replace: 0,
    })
    await handleRefresh()
  }

  return (
    <DetailsDrawer
      isOpen={isOpen}
      slots={[
        [
          InfoSlot,
          {
            isTitleEditable: canRename,
            onTitleChange: handleRename,
            isTitleEditDisabled: isActionsDisabled,
            title: marketplace?.NAME,
            id: marketplace?.ID,
            dataCy: 'marketplace-info',
            tags: getLabelTags(marketplace?.LABELS),
            labels: [
              [T.Owner, marketplace?.UNAME],
              [T.Group, marketplace?.GNAME],
            ],
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
                      isEnabled ? ['enable'] : isDisabled ? ['disable'] : []
                    }
                    buttons={[
                      canEnable && {
                        startIcon: <OnTag width="16px" height="16px" />,
                        onClick: handleEnableForm,
                        value: 'enable',
                        dataCy: `action-${MARKETPLACE_ACTIONS.ENABLE}`,
                        tooltip: T.Enable,
                        isDisabled: isActionsDisabled,
                      },
                      canDisable && {
                        startIcon: <OffTag width="16px" height="16px" />,
                        onClick: handleDisableForm,
                        value: 'disable',
                        dataCy: `action-${MARKETPLACE_ACTIONS.DISABLE}`,
                        tooltip: T.Disable,
                        isDisabled: isActionsDisabled,
                      },
                    ].filter(Boolean)}
                  />
                )}
                <ToggleGroup
                  size="medium"
                  options={[
                    [
                      {
                        ...getLabelMenuButtonProps({
                          selectedRows: [marketplace],
                          resourceType: RESOURCE_NAMES.MARKETPLACE,
                          isDisabled: isActionsDisabled,
                        }),
                      },
                      canUpdate && {
                        startIcon: <Edit width="16px" height="16px" />,
                        onClick: handleUpdate,
                        value: 'update',
                        'data-cy': `action-${MARKETPLACE_ACTIONS.UPDATE_DIALOG}`,
                        tooltip: T.Update,
                        isDisabled: isActionsDisabled,
                      },
                      {
                        startIcon: <RefreshDouble width="16px" height="16px" />,
                        onClick: handleRefresh,
                        value: 'refresh',
                        tooltip: T.Refresh,
                        isDisabled: isActionsDisabled,
                      },
                    ].filter(Boolean),
                    [
                      canDelete && {
                        startIcon: (
                          <Trash
                            width="16px"
                            height="16px"
                            style={{
                              color: isActionsDisabled
                                ? palette.text.disabled
                                : palette.icon.error,
                            }}
                          />
                        ),
                        onClick: handleDeleteForm,
                        value: 'delete',
                        'data-cy': `action-marketplace_${MARKETPLACE_ACTIONS.DELETE}`,
                        tooltip: T.Delete,
                        isDestructive: true,
                        isDisabled: isActionsDisabled,
                      },
                      {
                        startIcon: <Cancel width="16px" height="16px" />,
                        onClick: handleClose,
                        value: 'close',
                        tooltip: T.Close,
                      },
                    ].filter(Boolean),
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
              [
                <StatusTag
                  key="state"
                  statusColor={stateColor}
                  statusName={stateName}
                />,
                T.State,
              ],
              [
                <Tag
                  key="driver"
                  title={marketplace?.MARKET_MAD}
                  status="default"
                />,
                T.Driver,
              ],
              [apps, T.Apps],
              [percentLabel, T.Capacity],
            ],
          },
        ],
        [
          TabSlot,
          {
            tabs: Marketplace.Tabs.Single,
            resourceId: Marketplace.RID,
            tabProps: {
              marketplace,
              attributes,
              handleChangePermission,
              handleChangeOwnership,
              handleDeleteAttribute,
              handleAddAttribute,
              isLoadingMarketplace,
              isActionsDisabled,
            },
          },
          { flex: '1 1 0' },
        ],
      ]}
    />
  )
}

SingleView.displayName = 'SingleView'

SingleView.propTypes = {
  isOpen: PropTypes.bool,
  selectedMarketplace: PropTypes.object,
  handleClose: PropTypes.func,
  actions: PropTypes.array,
}
