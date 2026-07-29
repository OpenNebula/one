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
  Tag,
  ToggleGroup,
  ResourceActionConfirmation,
} from '@ComponentsV2Module'
import {
  LOGO_DRIVERS_IMAGES_URL,
  PROVIDER_ACTIONS,
  RESOURCE_NAMES,
  T,
} from '@ConstantsModule'
import { ProviderAPI, useModalsApi } from '@FeaturesModule'
import { Provider } from '@ResourcesModule'
import { getLabelTags } from '@ModelsModule'
import {
  permissionsToOctal,
  timeFromMilliseconds,
  toSnakeCase,
} from '@UtilsModule'
import { Box } from '@mui/material'
import { Component } from 'react'
import PropTypes from 'prop-types'
import { Cancel, RefreshDouble, Trash } from 'iconoir-react'

const getLogoSource = (fireedge = {}) => {
  if (!fireedge?.logo) return `${LOGO_DRIVERS_IMAGES_URL}/default.png`
  if (fireedge?.logo.includes(LOGO_DRIVERS_IMAGES_URL)) return fireedge.logo

  return `${LOGO_DRIVERS_IMAGES_URL}/${fireedge?.logo}`
}

/**
 * @param {object} root0 - Params
 * @param {boolean} root0.isOpen - Is open
 * @param {object} root0.selectedProvider - Selected provider
 * @param {Function} root0.handleClose - Handle close
 * @param {Array} root0.actions - Available actions
 * @returns {Component} - Single view details drawer
 */
export const SingleView = ({
  isOpen = false,
  selectedProvider = {},
  handleClose,
  actions = [],
}) => {
  const { showModal } = useModalsApi()

  const [refreshProvider, { data: refreshedProvider, isFetching }] =
    ProviderAPI.useLazyGetProviderQuery()
  const [rename, { isLoading: isRenaming }] =
    ProviderAPI.useRenameProviderMutation()
  const [remove, { isLoading: isRemoving }] =
    ProviderAPI.useRemoveProviderMutation()
  const [changePermissions, { isLoading: isChangingPermissions }] =
    ProviderAPI.useChangeProviderPermissionsMutation()
  const [changeOwnership, { isLoading: isChangingOwnership }] =
    ProviderAPI.useChangeProviderOwnershipMutation()

  const provider =
    refreshedProvider?.ID === selectedProvider?.ID
      ? refreshedProvider
      : selectedProvider

  const { ID, NAME, UNAME, GNAME, TEMPLATE = {} } = provider ?? {}
  const providerBody =
    TEMPLATE?.PROVIDER_BODY && typeof TEMPLATE.PROVIDER_BODY === 'object'
      ? TEMPLATE.PROVIDER_BODY
      : {}
  const { registration_time: registrationTime, fireedge = {} } = providerBody
  const provisionIds = Array.isArray(providerBody?.provision_ids)
    ? providerBody.provision_ids
    : Object.values(providerBody?.provision_ids ?? {}).filter(Boolean)
  const driver = providerBody?.driver ?? TEMPLATE?.DRIVER

  const handleRefresh = async () => refreshProvider({ id: ID })

  const handleRename = async (newName) => {
    await rename({ id: ID, template: { name: newName } })
    await handleRefresh()
  }

  const handleOpenDeleteForm = () =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title: `${T.Delete} ${T.Providers}`,
        description: (
          <ResourceActionConfirmation
            description={T['resource.delete.confirmation']}
            resources={provider}
            resourceType={T.Providers}
          />
        ),
        confirmLabel: T.Delete,
        confirmButtonProps: {
          isDestructive: true,
        },
      },
      onSubmit: async () => {
        await remove({ id: ID })
        handleClose()
      },
    })

  const handleChangePermission = async (newPermission) => {
    const [key, value] = Object.entries(newPermission)[0]
    const [member, permission] = toSnakeCase(key).toUpperCase().split('_')
    const fullPermissionName = `${member}_${permission[0]}`
    const newPermissions = {
      ...(provider?.PERMISSIONS ?? {}),
      [fullPermissionName]: value,
    }
    const octet = permissionsToOctal(newPermissions)

    await changePermissions({ id: ID, octet })
    await handleRefresh()
  }

  const handleChangeOwnership = async (newOwnership) => {
    await changeOwnership({ id: ID, ...newOwnership })
    await handleRefresh()
  }

  const isActionsDisabled =
    isFetching ||
    isRenaming ||
    isRemoving ||
    isChangingPermissions ||
    isChangingOwnership

  const canDelete = actions?.includes?.(PROVIDER_ACTIONS.DELETE)
  const numberOfProvisions = provisionIds?.length ?? 0
  const creationDate = registrationTime
    ? timeFromMilliseconds(+registrationTime).toRelative()
    : '-'

  return (
    <DetailsDrawer
      isOpen={isOpen}
      slots={[
        [
          InfoSlot,
          {
            isTitleEditable: true,
            onTitleChange: handleRename,
            isTitleEditDisabled: isActionsDisabled,
            icon: getLogoSource(fireedge),
            title: NAME,
            id: ID,
            tags: getLabelTags(provider?.LABELS),
            labels: [
              [T.Owner, UNAME],
              [T.Group, GNAME],
              [T.Registered, creationDate],
            ]?.filter(([, value]) => value !== undefined),
            Toolbar: () => (
              <Box
                sx={(theme) => ({
                  display: 'flex',
                  flexDirection: 'row',
                  gap: `${theme.scale[500]}px`,
                })}
              >
                <ToggleGroup
                  size="medium"
                  options={[
                    [
                      {
                        ...getLabelMenuButtonProps({
                          selectedRows: [provider],
                          resourceType: RESOURCE_NAMES.PROVIDER,
                          isDisabled: isActionsDisabled,
                        }),
                      },
                      {
                        startIcon: <RefreshDouble width="16px" height="16px" />,
                        onClick: handleRefresh,
                        value: 'refresh',
                        isDisabled: isActionsDisabled,
                      },
                    ],
                    [
                      {
                        startIcon: <Trash width="16px" height="16px" />,
                        onClick: handleOpenDeleteForm,
                        value: 'delete',
                        isDisabled: !canDelete || isActionsDisabled,
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
              [
                <Tag key="driver" title={driver ?? '-'} status="default" />,
                T.Driver,
              ],
              [String(numberOfProvisions), T.AssociatedProvisions],
            ],
          },
        ],
        [
          TabSlot,
          {
            tabs: Provider.Tabs.Single,
            resourceId: Provider.RID,
            tabProps: {
              selected: provider,
              handleChangePermission,
              handleChangeOwnership,
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
  selectedProvider: PropTypes.object,
  handleClose: PropTypes.func,
  actions: PropTypes.array,
}
