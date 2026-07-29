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
  ResourceActionConfirmation,
  SummarySlot,
  TabSlot,
} from '@ComponentsV2Module'

import { OneKsAPI, useModalsApi } from '@FeaturesModule'
import { Component, useMemo } from 'react'

import {
  createActions,
  getCommonValue,
  permissionsToOctal,
  toSnakeCase,
} from '@UtilsModule'

import {
  ONEKS_ACTIONS,
  RESOURCE_NAMES,
  STYLE_BUTTONS,
  T,
} from '@ConstantsModule'
import { Box } from '@mui/material'
import PropTypes from 'prop-types'
import { Cancel as CloseIcon, RefreshCircular, Trash } from 'iconoir-react'
import { OneKs as OneKsResource } from '@ResourcesModule'

const getPermissionOctet = (permissions = {}, newPermission = {}) => {
  const [key, value] = Object.entries(newPermission)[0] ?? []

  if (!key) return undefined

  const [member, permission] = toSnakeCase(key).toUpperCase().split('_')
  const fullPermissionName = `${member}_${permission?.[0]}`

  return permissionsToOctal({
    ...permissions,
    [fullPermissionName]: value,
  })
}

/**
 * @param {object} root0 - Params
 * @param {boolean} root0.isOpen - Is open
 * @param {object[]} root0.selectedData - Selected OneKs clusters
 * @param {Function} root0.handleClose - Handle close
 * @param {Function} root0.handleSelect - Handle select
 * @param {Function} root0.handleDeselect - Handle deselect
 * @param {object} root0.availableActions - Available actions
 * @returns {Component} - Aggregated view details drawer
 */
export const AggregatedView = ({
  isOpen = false,
  selectedData = [],
  handleClose,
  handleSelect,
  handleDeselect,
  availableActions = {},
}) => {
  const { showModal } = useModalsApi()
  const openDeleteKsClusterConfirmation =
    OneKsResource.Forms.useDeleteKsClusterConfirmation()

  const [refresh, { isFetching }] = OneKsAPI.useLazyGetOneKsClusterQuery()
  const [recover, { isLoading: isRecovering }] =
    OneKsAPI.useRecoverOneKsClusterMutation()
  const [remove, { isLoading: isRemoving }] =
    OneKsAPI.useDeleteOneKsClusterMutation()
  const [changePermissions, { isLoading: isChangingPermissions }] =
    OneKsAPI.useChangeOneKsClusterPermissionsMutation()
  const [changeOwnership, { isLoading: isChangingOwnership }] =
    OneKsAPI.useChangeOneKsClusterOwnershipMutation()

  const isMutating =
    isFetching ||
    isRecovering ||
    isRemoving ||
    isChangingPermissions ||
    isChangingOwnership

  const summary = useMemo(
    () => ({
      kubernetesVersion: getCommonValue(
        selectedData,
        (cluster) => cluster?.TEMPLATE?.CLUSTER_BODY?.kubernetes_version ?? '-'
      ),
      nodeGroups: selectedData.reduce(
        (total, cluster) =>
          total +
          []
            .concat(cluster?.TEMPLATE?.CLUSTER_BODY?.node_groups ?? [])
            .filter(Boolean).length,
        0
      ),
    }),
    [selectedData]
  )

  const handleRefresh = async () =>
    await Promise.all(selectedData.map(({ ID }) => refresh({ id: ID })))

  const handleOpenRecoverForm = () =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title: T.RecoverSeveralOneKsClusters,
        dataCy: 'modal-recover-oneks',
        description: (
          <ResourceActionConfirmation
            description={T['resource.recover.confirmation']}
            resources={selectedData}
            resourceType={T.KubernetesClusters}
          />
        ),
        confirmLabel: T.Recover,
      },
      onSubmit: async () => {
        await Promise.all(selectedData.map(({ ID }) => recover({ id: ID })))
        await handleRefresh()
      },
    })

  const handleOpenDeleteForm = () =>
    openDeleteKsClusterConfirmation({
      title: T.DeleteSelected,
      resources: selectedData,
      onSubmit: async (force) => {
        await Promise.all(
          selectedData.map(({ ID }) =>
            remove({
              id: ID,
              ...(force ? { force: true } : {}),
            })
          )
        )
        handleClose()
      },
    })

  const handleChangePermission = async (newPermission) => {
    await Promise.all(
      selectedData.map(({ ID, PERMISSIONS }) => {
        const octet = getPermissionOctet(PERMISSIONS, newPermission)

        return octet ? changePermissions({ id: ID, octet }) : Promise.resolve()
      })
    )

    await handleRefresh()
  }

  const handleChangeOwnership = async (newOwnership) => {
    await Promise.all(
      selectedData.map(({ ID }) => changeOwnership({ id: ID, ...newOwnership }))
    )

    await handleRefresh()
  }

  const [recoverButton] = createActions({
    filters: availableActions,
    actions: [
      {
        accessor: ONEKS_ACTIONS.RECOVER,
        startIcon: <RefreshCircular width="16px" height="16px" />,
        onClick: handleOpenRecoverForm,
        value: ONEKS_ACTIONS.RECOVER,
        title: T.Recover,
        isDisabled: isMutating,
        tooltip: T.Recover,
      },
    ],
  })

  const deleteButtons = createActions({
    filters: availableActions,
    actions: [
      {
        accessor: ONEKS_ACTIONS.DELETE,
      },
    ],
  })

  return (
    <DetailsDrawer
      isOpen={isOpen}
      slots={[
        [
          InfoSlot,
          {
            title: `${selectedData?.length} ${T.KubernetesClusters} ${T.Selected}`,
            Toolbar: () => (
              <Box
                sx={(theme) => ({
                  display: 'flex',
                  flexDirection: 'row',
                  gap: `${theme.scale[500]}px`,
                })}
              >
                {recoverButton && (
                  <Button
                    type={STYLE_BUTTONS.TYPE.SECONDARY}
                    size="small"
                    startIcon={recoverButton.startIcon}
                    onClick={recoverButton.onClick}
                    isDisabled={recoverButton.isDisabled}
                    tooltip={recoverButton.tooltip}
                  >
                    {recoverButton.title}
                  </Button>
                )}

                <LabelButton
                  selectedRows={selectedData}
                  resourceType={RESOURCE_NAMES.ONEKS}
                  isDisabled={isMutating}
                />
                {deleteButtons.length > 0 && (
                  <Button
                    type={STYLE_BUTTONS.TYPE.PRIMARY}
                    size="small"
                    startIcon={<Trash width={'16px'} height={'16px'} />}
                    onClick={handleOpenDeleteForm}
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
              [summary.kubernetesVersion, T.KubernetesVersion],
              [String(summary.nodeGroups), T.NodeGroups],
            ],
          },
        ],
        [
          TabSlot,
          {
            tabs: OneKsResource.Tabs.Aggregated,
            resourceId: OneKsResource.RID,
            tabProps: {
              selected: selectedData,
              handleChangeOwnership,
              handleChangePermission,
              handleSelect,
              handleDeselect,
              isActionsDisabled: isMutating,
              isMutating,
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
  selectedData: PropTypes.array,
  handleClose: PropTypes.func,
  handleSelect: PropTypes.func,
  handleDeselect: PropTypes.func,
  availableActions: PropTypes.object,
}
