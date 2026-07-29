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
  CloudDownload,
  DownloadCircle,
  Lock,
  NoLock,
  OffTag,
  OnTag,
  RefreshDouble,
  Trash,
} from 'iconoir-react'
import {
  MARKETPLACE_APP_ACTIONS,
  RESOURCE_NAMES,
  T,
  UNITS,
} from '@ConstantsModule'
import {
  MarketplaceAppAPI,
  useGeneralApi,
  useModalsApi,
  useViews,
} from '@FeaturesModule'
import {
  getLabelTags,
  getMarketplaceAppState,
  getMarketplaceAppType,
} from '@ModelsModule'
import {
  filterAttributes,
  getActionsAvailable,
  jsonToXml,
  prettyBytes,
  sentenceCase,
  timeFromMilliseconds,
} from '@UtilsModule'
import { MarketplaceApp } from '@ResourcesModule'

const HIDDEN_ATTRIBUTES_REG =
  /^(VMTEMPLATE64|APPTEMPLATE64|HYPERVISOR|ARCHITECTURE|VERSION)$/

/**
 * @param {object} root0 - Params
 * @param {boolean} root0.isOpen - Is open
 * @param {object} root0.selectedMarketplaceApp - Selected Marketplace App
 * @param {Function} root0.handleClose - Handle close
 * @param {Array} root0.actions - Available actions
 * @returns {Component} - Single view details drawer
 */
export const SingleView = ({
  isOpen = false,
  selectedMarketplaceApp = {},
  handleClose,
  actions = [],
}) => {
  const { palette } = useTheme()
  const { getResourceView } = useViews()
  const { enqueueSuccess } = useGeneralApi()
  const { showModal } = useModalsApi()

  // API
  const {
    data: fetchedMarketplaceApp = {},
    isFetching: isLoadingMarketplaceApp,
  } = MarketplaceAppAPI.useGetMarketplaceAppQuery(
    { id: selectedMarketplaceApp?.ID },
    {
      skip: !selectedMarketplaceApp?.ID,
      refetchOnMountOrArgChange: true,
    }
  )

  const [refreshMarketplaceApp, { isFetching: isRefreshingMarketplaceApp }] =
    MarketplaceAppAPI.useLazyGetMarketplaceAppQuery()
  const [rename, { isLoading: isRenaming }] =
    MarketplaceAppAPI.useRenameAppMutation()
  const [changeOwnership, { isLoading: isChangingOwnership }] =
    MarketplaceAppAPI.useChangeAppOwnershipMutation()
  const [changePermissions, { isLoading: isChangingPermissions }] =
    MarketplaceAppAPI.useChangeAppPermissionsMutation()
  const [update, { isLoading: isUpdating }] =
    MarketplaceAppAPI.useUpdateAppMutation()
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
  const [download, { isLoading: isDownloading }] =
    MarketplaceAppAPI.useDownloadAppMutation()
  const [exportApp, { isLoading: isExporting }] =
    MarketplaceAppAPI.useExportAppMutation()

  const marketplaceApp =
    String(fetchedMarketplaceApp?.ID) === String(selectedMarketplaceApp?.ID)
      ? fetchedMarketplaceApp
      : selectedMarketplaceApp
  const { color: stateColor, name: stateName } =
    getMarketplaceAppState(marketplaceApp) ?? {}
  const typeName = getMarketplaceAppType(marketplaceApp)

  const infoActions = getResourceView(RESOURCE_NAMES.APP)?.['info-tabs']?.info
    ?.information_panel?.actions
  const canRename = getActionsAvailable(infoActions).includes(
    MARKETPLACE_APP_ACTIONS.RENAME
  )
  const hasAction = (action) => !actions?.length || actions.includes(action)
  const canLock = hasAction(MARKETPLACE_APP_ACTIONS.LOCK)
  const canUnlock = hasAction(MARKETPLACE_APP_ACTIONS.UNLOCK)
  const canEnable = hasAction(MARKETPLACE_APP_ACTIONS.ENABLE)
  const canDisable = hasAction(MARKETPLACE_APP_ACTIONS.DISABLE)
  const canExport = hasAction(MARKETPLACE_APP_ACTIONS.EXPORT)
  const canDownload = hasAction(MARKETPLACE_APP_ACTIONS.DOWNLOAD)
  const canDelete = hasAction(MARKETPLACE_APP_ACTIONS.DELETE)

  const attributes = useMemo(() => {
    const { attributes: filteredAttributes = {} } = filterAttributes(
      marketplaceApp?.TEMPLATE,
      { hidden: HIDDEN_ATTRIBUTES_REG }
    )

    return Object.entries(filteredAttributes).map(([key, value]) => ({
      key,
      rawValue: value,
      value: value && typeof value === 'object' ? JSON.stringify(value) : value,
    }))
  }, [marketplaceApp?.TEMPLATE])

  const isActionsDisabled =
    isLoadingMarketplaceApp ||
    isRefreshingMarketplaceApp ||
    isRenaming ||
    isChangingOwnership ||
    isChangingPermissions ||
    isUpdating ||
    isRemoving ||
    isLocking ||
    isUnlocking ||
    isEnabling ||
    isDisabling ||
    isDownloading ||
    isExporting

  const isDisabled = +marketplaceApp?.STATE === 4
  const isLocked = Object.hasOwn(marketplaceApp ?? {}, 'LOCK')

  // Actions
  const handleRefresh = async () =>
    marketplaceApp?.ID &&
    (await refreshMarketplaceApp({ id: marketplaceApp.ID }))

  const handleDownload = async () => {
    const url = await download(marketplaceApp?.ID).unwrap()
    window.open(url, '_blank')
  }

  const handleExport = async (formData) => {
    const response = await exportApp({
      id: marketplaceApp?.ID,
      ...formData,
    }).unwrap()

    enqueueSuccess(response)
  }

  const handleEnable = async () => {
    await enable(marketplaceApp?.ID)
    await handleRefresh()
  }

  const handleDisable = async () => {
    await disable(marketplaceApp?.ID)
    await handleRefresh()
  }

  const handleLock = async () => {
    await lock({ id: marketplaceApp?.ID })
    await handleRefresh()
  }

  const handleUnlock = async () => {
    await unlock({ id: marketplaceApp?.ID })
    await handleRefresh()
  }

  const handleRename = async (newName) => {
    await rename({ id: marketplaceApp?.ID, name: newName })
    await handleRefresh()
  }

  const handleChangePermission = async (newPermission) => {
    await changePermissions({ id: marketplaceApp?.ID, ...newPermission })
    await handleRefresh()
  }

  const handleChangeOwnership = async (newOwnership) => {
    await changeOwnership({ id: marketplaceApp?.ID, ...newOwnership })
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
  const handleDeleteForm = () =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title: `${T.Delete} ${T.App}`,
        description: (
          <ResourceActionConfirmation
            description={T['resource.delete.confirmation']}
            resources={marketplaceApp}
            resourceType={T.Apps}
          />
        ),
        confirmLabel: T.Delete,
        confirmButtonProps: {
          isDestructive: true,
        },
      },
      onSubmit: async () => {
        await remove({ id: marketplaceApp?.ID })
        handleClose()
      },
    })

  const handleEnableForm = () =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title: `${T.Enable} ${T.App}`,
        description: (
          <ResourceActionConfirmation
            description={T['resource.enable.confirmation']}
            resources={marketplaceApp}
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
        title: `${T.Disable} ${T.App}`,
        description: (
          <ResourceActionConfirmation
            description={T['resource.disable.confirmation']}
            resources={marketplaceApp}
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
        title: `${T.Lock} ${T.App}`,
        description: (
          <ResourceActionConfirmation
            description={T['resource.lock.confirmation']}
            resources={marketplaceApp}
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
        title: `${T.Unlock} ${T.App}`,
        description: (
          <ResourceActionConfirmation
            description={T['resource.unlock.confirmation']}
            resources={marketplaceApp}
            resourceType={T.Apps}
          />
        ),
        confirmLabel: T.Unlock,
      },
      onSubmit: handleUnlock,
    })

  const handleExportForm = () =>
    showModal({
      isFormDialog: true,
      dialogProps: {
        title: T.DownloadAppToOpenNebula,
        steps: MarketplaceApp.Forms.ExportForm,
        stepProps: marketplaceApp,
        initialValues: marketplaceApp,
      },
      onSubmit: handleExport,
    })

  // Helpers
  const updateTemplate = async (nextAttributes) => {
    const nextTemplate = { ...(marketplaceApp?.TEMPLATE ?? {}) }
    attributes.forEach(({ key }) => {
      delete nextTemplate[key]
    })
    nextAttributes.forEach(({ key, rawValue, value }) => {
      nextTemplate[key] = rawValue ?? value
    })

    await update({
      id: marketplaceApp?.ID,
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
            title: marketplaceApp?.NAME,
            id: marketplaceApp?.ID,
            tags: getLabelTags(marketplaceApp?.LABELS),
            labels: [
              [T.Owner, marketplaceApp?.UNAME],
              [T.Group, marketplaceApp?.GNAME],
              [
                T.Registered,
                marketplaceApp?.REGTIME
                  ? timeFromMilliseconds(+marketplaceApp.REGTIME).toRelative()
                  : '-',
              ],
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
                    selected={isDisabled ? ['disable'] : ['enable']}
                    buttons={[
                      canEnable && {
                        startIcon: <OnTag width="16px" height="16px" />,
                        onClick: handleEnableForm,
                        value: 'enable',
                        tooltip: T.Enable,
                        isDisabled: isActionsDisabled,
                      },
                      canDisable && {
                        startIcon: <OffTag width="16px" height="16px" />,
                        onClick: handleDisableForm,
                        value: 'disable',
                        tooltip: T.Disable,
                        isDisabled: isActionsDisabled,
                      },
                    ].filter(Boolean)}
                  />
                )}
                {(canLock || canUnlock) && (
                  <ButtonGroup
                    selected={isLocked ? ['lock'] : ['unlock']}
                    buttons={[
                      canLock && {
                        startIcon: <Lock width="16px" height="16px" />,
                        onClick: handleLockForm,
                        value: 'lock',
                        tooltip: T.Lock,
                        isDisabled: isActionsDisabled,
                      },
                      canUnlock && {
                        startIcon: <NoLock width="16px" height="16px" />,
                        onClick: handleUnlockForm,
                        value: 'unlock',
                        tooltip: T.Unlock,
                        isDisabled: isActionsDisabled,
                      },
                    ].filter(Boolean)}
                  />
                )}
                <ToggleGroup
                  size="medium"
                  options={[
                    [
                      canExport && {
                        startIcon: <CloudDownload width="16px" height="16px" />,
                        onClick: handleExportForm,
                        value: 'export',
                        tooltip: T.Import,
                        isDisabled: isActionsDisabled,
                      },
                      canDownload && {
                        startIcon: (
                          <DownloadCircle width="16px" height="16px" />
                        ),
                        onClick: handleDownload,
                        value: 'download',
                        tooltip: T.DownloadApp,
                        isDisabled: isActionsDisabled,
                      },
                    ].filter(Boolean),
                    [
                      {
                        ...getLabelMenuButtonProps({
                          selectedRows: [marketplaceApp],
                          resourceType: RESOURCE_NAMES.APP,
                          isDisabled: isActionsDisabled,
                        }),
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
                  key="type"
                  title={typeName ? sentenceCase(typeName) : '-'}
                  status="default"
                />,
                T.Type,
              ],
              [prettyBytes(marketplaceApp?.SIZE, UNITS.MB), T.Size],
              [
                <Tag
                  key="version"
                  title={marketplaceApp?.VERSION ?? '-'}
                  status="default"
                />,
                T.Version,
              ],
            ],
          },
        ],
        [
          TabSlot,
          {
            tabs: MarketplaceApp.Tabs.Single,
            resourceId: MarketplaceApp.RID,
            tabProps: {
              marketplaceApp,
              attributes,
              handleChangePermission,
              handleChangeOwnership,
              handleDeleteAttribute,
              handleAddAttribute,
              isLoadingMarketplaceApp,
              isActionsDisabled,
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
  selectedMarketplaceApp: PropTypes.object,
  handleClose: PropTypes.func,
  actions: PropTypes.array,
}
