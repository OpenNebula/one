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
  MenuButton,
  ResourceActionConfirmation,
  SummarySlot,
  StatusTag,
  TabSlot,
  ToggleGroup,
} from '@ComponentsV2Module'
import { Box, useTheme } from '@mui/material'
import { Component, useMemo } from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'
import { Cancel, RefreshCircular, RefreshDouble, Trash } from 'iconoir-react'
import {
  RESOURCE_NAMES,
  SERVICE_ACTION_ENUM,
  SERVICE_ACTIONS,
  T,
} from '@ConstantsModule'
import {
  ONE_RESOURCES_POOL,
  ServiceAPI,
  oneApi,
  useModalsApi,
} from '@FeaturesModule'
import {
  getLabelTags,
  getServiceState,
  getServiceTotalNetworks,
  getServiceTotalRoles,
  getServiceTotalVms,
} from '@ModelsModule'
import { permissionsToOctal, toSnakeCase } from '@UtilsModule'
import { Service } from '@ResourcesModule'

const getPermissionOctet = (permissions = {}, newPermission = {}) => {
  const [key, value] = Object.entries(newPermission)[0] ?? []
  if (!key) return undefined

  const [member, permission] = toSnakeCase(key).toUpperCase().split('_')
  const fullPermissionName = `${member}_${permission[0]}`

  return permissionsToOctal({
    ...permissions,
    [fullPermissionName]: value,
  })
}

/**
 * @param {object} root0 - Params
 * @param {boolean} root0.isOpen - Is open
 * @param {object} root0.selectedService - Selected Service
 * @param {Function} root0.handleClose - Handle close
 * @param {object} root0.viewConfig - View config
 * @returns {Component} - Single view details drawer
 */
export const SingleView = ({
  isOpen = false,
  selectedService = {},
  handleClose,
  viewConfig = {},
}) => {
  const serviceId = selectedService?.ID
  const { palette } = useTheme()
  const { showModal } = useModalsApi()
  const dispatch = useDispatch()

  const {
    data: detailedService = {},
    refetch: refreshService,
    isFetching: isRefreshingService,
  } = ServiceAPI.useGetServiceQuery(
    { id: serviceId },
    { skip: !isOpen || !serviceId }
  )
  const service = detailedService?.ID ? detailedService : selectedService

  const handleRefresh = async () => {
    if (!serviceId) return

    await refreshService()
    dispatch(oneApi.util.invalidateTags([ONE_RESOURCES_POOL.VM_POOL]))
  }

  const { actions, isLoading: isPerformingAction } = Service.Actions.useActions(
    {
      context:
        (fn) =>
        (params = {}) =>
          fn?.({ id: serviceId, ...params }),
    }
  )

  const {
    [SERVICE_ACTION_ENUM.RENAME]: renameAction,
    [SERVICE_ACTION_ENUM.CHANGE_MODE]: changePermissionsAction,
    [SERVICE_ACTION_ENUM.CHANGE_OWNER]: changeOwnerAction,
    [SERVICE_ACTION_ENUM.CHANGE_GROUP]: changeGroupAction,
  } = actions

  const infoConfig = viewConfig?.['info-tabs']?.info
  const informationPanel = infoConfig?.information_panel

  const [renameOption] =
    Service.Actions.Utils.generateMenuOptions({
      keys: [SERVICE_ACTION_ENUM.RENAME],
      actions,
      viewConfig: informationPanel,
      showModal,
    }) ?? []

  const canRename = !!informationPanel?.enabled && !renameOption?.isDisabled
  const isActionsDisabled = isRefreshingService || isPerformingAction

  const serviceState = getServiceState(service) ?? {}

  const summary = useMemo(
    () => ({
      state: serviceState?.displayName ?? T.Unknown,
      roles: getServiceTotalRoles(service),
      vms: getServiceTotalVms(service),
      networks: getServiceTotalNetworks(service),
    }),
    [service, serviceState]
  )

  const handleRename = async (name) => {
    await renameAction?.mutate({ name })
    await handleRefresh()
  }

  const handleChangePermission = async (newPermission) => {
    const octet = getPermissionOctet(service?.PERMISSIONS, newPermission)
    if (octet === undefined) return

    await changePermissionsAction?.mutate({ octet })
    await handleRefresh()
  }

  const handleChangeOwnership = async (newOwnership) => {
    const action = Object.hasOwn(newOwnership, 'group')
      ? changeGroupAction
      : changeOwnerAction

    await action?.mutate(newOwnership)
    await handleRefresh()
  }

  const recoverOptions = (
    Service.Actions.Utils.generateMenuOptions({
      keys: Service.Actions.Groups.Recover,
      actions,
      viewConfig,
      showModal: (modalProps) => {
        const isRecoverDelete =
          modalProps?.dialogProps?.dataCy ===
          `modal-${SERVICE_ACTIONS.RECOVER_DELETE}`
        const title = isRecoverDelete ? T.RecoverDelete : T.RecoverService

        showModal({
          ...modalProps,
          name: title,
          dialogProps: {
            ...modalProps?.dialogProps,
            title,
            description: (
              <ResourceActionConfirmation
                description={
                  isRecoverDelete
                    ? T['resource.recoverDelete.confirmation']
                    : T['resource.recover.confirmation']
                }
                resources={service}
                resourceType={T.Services}
              />
            ),
          },
          onSubmit: async (...args) => {
            await modalProps?.onSubmit?.(...args)
            isRecoverDelete ? handleClose?.() : await handleRefresh()
          },
        })
      },
    }) ?? []
  )
    .filter(({ isDisabled }) => !isDisabled)
    .map((option) => ({
      ...option,
      title:
        option.eACTION === SERVICE_ACTION_ENUM.RECOVER
          ? T.RecoverService
          : option.title,
      startIcon:
        option.eACTION === SERVICE_ACTION_ENUM.RECOVER ? (
          <RefreshCircular width="16px" height="16px" />
        ) : (
          <Trash width="16px" height="16px" />
        ),
      isDisabled: isActionsDisabled,
    }))

  const [deleteOption] =
    Service.Actions.Utils.generateMenuOptions({
      keys: Service.Actions.Groups.Delete,
      actions,
      viewConfig,
      showModal: (modalProps) =>
        showModal({
          ...modalProps,
          name: `${T.Delete} ${T.Service}`,
          dialogProps: {
            ...modalProps?.dialogProps,
            title: `${T.Delete} ${T.Service}`,
            description: (
              <ResourceActionConfirmation
                description={T['resource.delete.confirmation']}
                resources={service}
                resourceType={T.Services}
              />
            ),
          },
          onSubmit: async (...args) => {
            await modalProps?.onSubmit?.(...args)
            handleClose?.()
          },
        }),
    }) ?? []

  const deleteAction =
    deleteOption && !deleteOption.isDisabled
      ? {
          ...deleteOption,
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
          value: 'delete',
          tooltip: T.Delete,
          isDestructive: true,
          isDisabled: isActionsDisabled,
        }
      : undefined

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
            title: service?.NAME,
            id: service?.ID,
            tags: getLabelTags(service?.LABELS),
            labels: [
              [T.Owner, service?.UNAME],
              [T.Group, service?.GNAME],
            ],
            Toolbar: () => (
              <Box
                sx={(theme) => ({
                  display: 'flex',
                  flexDirection: 'row',
                  gap: `${theme.scale[500]}px`,
                })}
              >
                {!!recoverOptions.length && (
                  <MenuButton
                    placeholder={T.Recover}
                    options={[recoverOptions]}
                    isDisabled={isActionsDisabled}
                  />
                )}
                <ToggleGroup
                  size="medium"
                  options={[
                    [
                      {
                        ...getLabelMenuButtonProps({
                          selectedRows: [service],
                          resourceType: RESOURCE_NAMES.SERVICE,
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
                      deleteAction,
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
                  statusColor={serviceState?.color}
                  statusName={summary.state}
                />,
                T.State,
              ],
              [summary.roles, T.Roles],
              [summary.vms, T.TotalVms],
              [summary.networks, T.Networks],
            ],
          },
        ],
        [
          TabSlot,
          {
            tabs: Service.Tabs.Single,
            resourceId: Service.RID,
            tabProps: {
              selected: service,
              handleChangeOwnership,
              handleChangePermission,
              handleRefresh,
              isActionsDisabled,
              isRefreshingService,
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
  selectedService: PropTypes.object,
  handleClose: PropTypes.func,
  viewConfig: PropTypes.object,
}
