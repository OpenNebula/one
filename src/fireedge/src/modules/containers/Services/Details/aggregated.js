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
  DetailsDrawer,
  InfoSlot,
  LabelButton,
  MenuButton,
  ResourceActionConfirmation,
  SummarySlot,
  TabSlot,
} from '@ComponentsV2Module'
import { Box } from '@mui/material'
import { Component, useMemo } from 'react'
import PropTypes from 'prop-types'
import { Cancel as CloseIcon, RefreshCircular, Trash } from 'iconoir-react'
import {
  RESOURCE_NAMES,
  SERVICE_TEMPLATE_ACTIONS,
  STYLE_BUTTONS,
  T,
} from '@ConstantsModule'
import { ServiceAPI, useModalsApi } from '@FeaturesModule'
import {
  getServiceState,
  getServiceTotalNetworks,
  getServiceTotalRoles,
  getServiceTotalVms,
} from '@ModelsModule'
import { getCommonValue, permissionsToOctal, toSnakeCase } from '@UtilsModule'
import { Service } from '@ResourcesModule'

const SERVICE_ACTIONS = {
  RECOVER_DELETE: 'recover_delete',
}

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
 * @param {object[]} root0.selectedServices - Selected Services
 * @param {Function} root0.handleClose - Handle close
 * @param {Function} root0.handleSelect - Handle select
 * @param {Function} root0.handleDeselect - Handle deselect
 * @param {Array} root0.actions - Available actions
 * @returns {Component} - Aggregated view details drawer
 */
export const AggregatedView = ({
  isOpen = false,
  selectedServices = [],
  handleClose,
  handleSelect,
  handleDeselect,
  actions = [],
}) => {
  const { showModal } = useModalsApi()

  const [refreshService, { isFetching: isRefreshingService }] =
    ServiceAPI.useLazyGetServiceQuery()
  const [remove, { isLoading: isRemoving }] =
    ServiceAPI.useRemoveServiceMutation()
  const [recover, { isLoading: isRecovering }] =
    ServiceAPI.useRecoverServiceMutation()
  const [changeOwnership, { isLoading: isChangingOwnership }] =
    ServiceAPI.useChangeServiceOwnerMutation()
  const [addServiceAction, { isLoading: isAddingAction }] =
    ServiceAPI.useServiceAddActionMutation()

  const hasAction = (action) => actions?.includes(action)
  const canDelete = hasAction(SERVICE_TEMPLATE_ACTIONS.DELETE)
  const canRecover = hasAction(SERVICE_TEMPLATE_ACTIONS.RECOVER)
  const canRecoverDelete = hasAction(SERVICE_ACTIONS.RECOVER_DELETE)

  const isMutating =
    isRefreshingService ||
    isRemoving ||
    isRecovering ||
    isChangingOwnership ||
    isAddingAction

  const summary = useMemo(
    () => ({
      state: getCommonValue(
        selectedServices,
        (service) => getServiceState(service)?.displayName ?? T.Unknown
      ),
      roles: selectedServices.reduce(
        (total, service) => total + getServiceTotalRoles(service),
        0
      ),
      vms: selectedServices.reduce(
        (total, service) => total + getServiceTotalVms(service),
        0
      ),
      networks: selectedServices.reduce(
        (total, service) => total + getServiceTotalNetworks(service),
        0
      ),
    }),
    [selectedServices]
  )

  const handleRefresh = async () =>
    await Promise.all(
      selectedServices.map(({ ID }) => refreshService({ id: ID }))
    )

  const handleChangePermission = async (newPermission) => {
    await Promise.all(
      selectedServices.map(({ ID, PERMISSIONS }) => {
        const octet = getPermissionOctet(PERMISSIONS, newPermission)

        return octet === undefined
          ? Promise.resolve()
          : addServiceAction({
              id: ID,
              perform: 'chmod',
              params: { octet },
            })
      })
    )
    await handleRefresh()
  }

  const handleChangeOwnership = async (newOwnership) => {
    await Promise.all(
      selectedServices.map(({ ID }) =>
        changeOwnership({ id: ID, ...newOwnership })
      )
    )
    await handleRefresh()
  }

  const handleRecover = async ({ delete: deleteAfterRecover } = {}) => {
    await Promise.all(
      selectedServices.map(({ ID }) =>
        recover({ id: ID, delete: deleteAfterRecover })
      )
    )

    if (deleteAfterRecover) {
      handleClose()

      return
    }

    await handleRefresh()
  }

  const handleRecoverForm = (deleteAfterRecover = false) =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title: deleteAfterRecover ? T.RecoverDelete : T.RecoverSeveralServices,
        description: (
          <ResourceActionConfirmation
            description={
              deleteAfterRecover
                ? T['resource.recoverDelete.confirmation']
                : T['resource.recover.confirmation']
            }
            resources={selectedServices}
            resourceType={T.Services}
          />
        ),
      },
      onSubmit: async () => await handleRecover({ delete: deleteAfterRecover }),
    })

  const handleDeleteForm = () =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title: `${T.Delete} ${T.Services}`,
        description: (
          <ResourceActionConfirmation
            description={T['resource.delete.confirmation']}
            resources={selectedServices}
            resourceType={T.Services}
          />
        ),
      },
      onSubmit: async () => {
        await Promise.all(selectedServices.map(({ ID }) => remove({ id: ID })))
        handleClose()
      },
    })

  const recoverOptions = [
    canRecover && {
      title: T.RecoverSeveralServices,
      startIcon: <RefreshCircular width="16px" height="16px" />,
      onClick: () => handleRecoverForm(false),
      isDisabled: isMutating,
    },
    canRecoverDelete && {
      title: T.RecoverDelete,
      isDestructive: true,
      startIcon: <Trash width="16px" height="16px" />,
      onClick: () => handleRecoverForm(true),
      isDisabled: isMutating,
    },
  ].filter(Boolean)

  return (
    <DetailsDrawer
      isOpen={isOpen}
      slots={[
        [
          InfoSlot,
          {
            title: `${selectedServices?.length} ${T.Services} ${T.Selected}`,
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
                    isDisabled={isMutating}
                  />
                )}
                <LabelButton
                  selectedRows={selectedServices}
                  resourceType={RESOURCE_NAMES.SERVICE}
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
              [summary.state, T.State],
              [summary.roles, T.Roles],
              [summary.vms, T.TotalVms],
              [summary.networks, T.Networks],
            ],
          },
        ],
        [
          TabSlot,
          {
            tabs: Service.Tabs.Aggregated,
            resourceId: Service.RID,
            tabProps: {
              selected: selectedServices,
              handleChangeOwnership,
              handleChangePermission,
              handleSelect,
              handleDeselect,
              isActionsDisabled: isMutating,
            },
          },
          { flex: '1 1 0' },
        ],
      ]}
    />
  )
}

AggregatedView.displayName = 'AggregatedView'

AggregatedView.propTypes = {
  isOpen: PropTypes.bool,
  selectedServices: PropTypes.array,
  handleClose: PropTypes.func,
  handleSelect: PropTypes.func,
  handleDeselect: PropTypes.func,
  actions: PropTypes.array,
}
