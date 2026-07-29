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
  TabSlot,
  ToggleGroup,
} from '@ComponentsV2Module'
import { Box, useTheme } from '@mui/material'
import { Component, useMemo } from 'react'
import PropTypes from 'prop-types'
import { Cancel, Lock, NoLock, RefreshDouble, Trash } from 'iconoir-react'
import { RESOURCE_NAMES, T, VROUTER_ACTIONS } from '@ConstantsModule'
import { useModalsApi, useViews, VrAPI } from '@FeaturesModule'
import { cloneObject, getActionsAvailable, jsonToXml, set } from '@UtilsModule'
import {
  getLabelTags,
  getVirtualRouterTotalNics,
  getVirtualRouterTotalVms,
} from '@ModelsModule'
import { VirtualRouter } from '@ResourcesModule'

const deletePath = (source = {}, path = '') => {
  const parts = path.toString().match(/[^.[\]]+/g) || []
  const last = parts.pop()
  const parent = parts.reduce((acc, part) => acc?.[part], source)

  if (parent && last !== undefined) delete parent[last]

  return source
}

/**
 * @param {object} root0 - Params
 * @param {boolean} root0.isOpen - Is open
 * @param {object} root0.selectedVRouter - Selected Virtual Router
 * @param {Function} root0.handleClose - Handle close
 * @param {Array} root0.actions - Available actions
 * @returns {Component} - Single view details drawer
 */
export const SingleView = ({
  isOpen = false,
  selectedVRouter = {},
  handleClose,
  actions = [],
}) => {
  const { palette } = useTheme()
  const { showModal } = useModalsApi()
  const { getResourceView } = useViews()

  // API
  const { data: fetchedVRouter = {}, isFetching: isLoadingVRouter } =
    VrAPI.useGetVrQuery(
      { id: selectedVRouter?.ID },
      {
        skip: !selectedVRouter?.ID,
        refetchOnMountOrArgChange: true,
      }
    )

  const [refreshVRouter, { isFetching: isRefreshingVRouter }] =
    VrAPI.useLazyGetVrQuery()
  const [rename, { isLoading: isRenaming }] = VrAPI.useRenameVrMutation()
  const [changeOwnership, { isLoading: isChangingOwnership }] =
    VrAPI.useChangeVrOwnershipMutation()
  const [changePermissions, { isLoading: isChangingPermissions }] =
    VrAPI.useChangeVrPermissionsMutation()
  const [update, { isLoading: isUpdating }] = VrAPI.useUpdateVrMutation()
  const [remove, { isLoading: isRemoving }] = VrAPI.useDeleteVrMutation()
  const [lock, { isLoading: isLocking }] = VrAPI.useLockVrMutation()
  const [unlock, { isLoading: isUnlocking }] = VrAPI.useUnlockVrMutation()

  // State
  const vrouter =
    String(fetchedVRouter?.ID) === String(selectedVRouter?.ID)
      ? fetchedVRouter
      : selectedVRouter

  const infoActions = getResourceView(RESOURCE_NAMES.VROUTER)?.['info-tabs']
    ?.info?.information_panel?.actions
  const canRename = getActionsAvailable(infoActions).includes(
    VROUTER_ACTIONS.RENAME
  )
  const hasAction = (action) => !actions?.length || actions.includes(action)
  const canDelete = hasAction(VROUTER_ACTIONS.DELETE)
  const canLock = hasAction(VROUTER_ACTIONS.LOCK)
  const canUnlock = hasAction(VROUTER_ACTIONS.UNLOCK)

  const isActionsDisabled =
    isLoadingVRouter ||
    isRefreshingVRouter ||
    isRenaming ||
    isChangingOwnership ||
    isChangingPermissions ||
    isUpdating ||
    isRemoving ||
    isLocking ||
    isUnlocking

  const isLocked = !!vrouter?.LOCK
  const isDeleteDisabled = isActionsDisabled || isLocked || !canDelete

  const summary = useMemo(
    () => ({
      vms: getVirtualRouterTotalVms(vrouter),
      nics: getVirtualRouterTotalNics(vrouter),
    }),
    [vrouter]
  )

  // Actions
  const handleRefresh = async () =>
    vrouter?.ID && (await refreshVRouter({ id: vrouter.ID }))

  const handleLock = async () => {
    await lock({ id: vrouter?.ID })
    await handleRefresh()
  }

  const handleUnlock = async () => {
    await unlock({ id: vrouter?.ID })
    await handleRefresh()
  }

  const handleRename = async (newName) => {
    await rename({ id: vrouter?.ID, name: newName })
    await handleRefresh()
  }

  const handleChangePermission = async (newPermission) => {
    await changePermissions({ id: vrouter?.ID, ...newPermission })
    await handleRefresh()
  }

  const handleChangeOwnership = async (newOwnership) => {
    await changeOwnership({ id: vrouter?.ID, ...newOwnership })
    await handleRefresh()
  }

  const updateTemplate = async (nextTemplate) => {
    await update({
      id: vrouter?.ID,
      template: jsonToXml(nextTemplate),
      update: 0,
      replace: 0,
    })
    await handleRefresh()
  }

  const handleDeleteAttribute = async (_, attribute) => {
    if (!attribute?.path) return

    await updateTemplate(
      deletePath(cloneObject(vrouter?.TEMPLATE), attribute.path)
    )
  }

  const handleEditAttribute = async ({ path, value }) => {
    const nextTemplate = cloneObject(vrouter?.TEMPLATE)

    set(nextTemplate, path, value)
    await updateTemplate(nextTemplate)
  }

  const handleAddAttribute = async ({ key, value }) => {
    await updateTemplate({
      ...(vrouter?.TEMPLATE ?? {}),
      [key]: value,
    })
  }

  // Modals
  const handleLockForm = () =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title: `${T.Lock} ${T.VirtualRouter}`,
        description: (
          <ResourceActionConfirmation
            description={T['resource.lock.confirmation']}
            resources={vrouter}
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
        title: `${T.Unlock} ${T.VirtualRouter}`,
        description: (
          <ResourceActionConfirmation
            description={T['resource.unlock.confirmation']}
            resources={vrouter}
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
        title: `${T.Delete} ${T.VirtualRouter}`,
        description: (
          <ResourceActionConfirmation
            description={T['resource.delete.confirmation']}
            resources={vrouter}
            resourceType={T.VirtualRouters}
          />
        ),
        confirmLabel: T.Delete,
        confirmButtonProps: {
          isDestructive: true,
        },
      },
      onSubmit: async () => {
        await remove({ id: vrouter?.ID })
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
            isTitleEditable: canRename,
            onTitleChange: handleRename,
            isTitleEditDisabled: isActionsDisabled,
            title: vrouter?.NAME,
            id: vrouter?.ID,
            tags: getLabelTags(vrouter?.LABELS),
            labels: [
              [T.Owner, vrouter?.UNAME],
              [T.Group, vrouter?.GNAME],
            ],
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
                      {
                        ...getLabelMenuButtonProps({
                          selectedRows: [vrouter],
                          resourceType: RESOURCE_NAMES.VROUTER,
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
                    ],
                    [
                      canDelete && {
                        startIcon: (
                          <Trash
                            width="16px"
                            height="16px"
                            style={{
                              color: isDeleteDisabled
                                ? palette.text.disabled
                                : palette.icon.error,
                            }}
                          />
                        ),
                        onClick: handleDeleteForm,
                        value: 'delete',
                        tooltip: T.Delete,
                        isDestructive: true,
                        isDisabled: isDeleteDisabled,
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
              [summary.vms, T.TotalVms],
              [summary.nics, T.NIC],
            ],
          },
        ],
        [
          TabSlot,
          {
            tabs: VirtualRouter.Tabs.Single,
            resourceId: VirtualRouter.RID,
            tabProps: {
              vrouter,
              handleChangePermission,
              handleChangeOwnership,
              handleDeleteAttribute,
              handleEditAttribute,
              handleAddAttribute,
              handleRefresh,
              actions,
              isLoadingVRouter,
              isActionsDisabled,
              isLocked,
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
  selectedVRouter: PropTypes.object,
  handleClose: PropTypes.func,
  actions: PropTypes.array,
}
