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
  ResourceActionConfirmation,
  SummarySlot,
  TabSlot,
  ToggleGroup,
} from '@ComponentsV2Module'
import {
  CLUSTER_ACTIONS,
  CLUSTER_CLOUD_OPERATIONS,
  PATH,
  PROVISION_ACTIONS,
  RESOURCE_NAMES,
  T,
} from '@ConstantsModule'
import {
  ClusterAPI,
  ProvisionAPI,
  useGeneralApi,
  useModalsApi,
  useViews,
} from '@FeaturesModule'
import { Box, useTheme } from '@mui/material'
import { Component } from 'react'
import {
  Cancel,
  CloudDesync,
  Edit,
  RefreshDouble,
  Restart,
  Trash,
} from 'iconoir-react'
import { getActionsAvailable, getTotalOfResources } from '@UtilsModule'
import PropTypes from 'prop-types'
import { generatePath, useHistory } from 'react-router'
import { Cluster } from '@ResourcesModule'
import { getLabelTags } from '@ModelsModule'

/**
 * @param {object} root0 - Params
 * @param {boolean} root0.isOpen - Is open
 * @param {object} root0.selectedCluster - Selected cluster
 * @param {Function} root0.handleClose - Handle close
 * @param {Array} root0.actions - Available actions
 * @returns {Component} - Single cluster details drawer
 */
export const SingleView = ({
  isOpen = false,
  selectedCluster = {},
  handleClose,
  actions = [],
}) => {
  const { palette } = useTheme()
  const history = useHistory()
  const { enqueueSuccess } = useGeneralApi()
  const { showModal } = useModalsApi()
  const { getResourceView } = useViews()

  const [refreshCluster, { data: refreshedCluster, isFetching }] =
    ClusterAPI.useLazyGetClusterQuery()
  const [rename, { isLoading: isRenaming }] =
    ClusterAPI.useRenameClusterMutation()
  const [remove, { isLoading: isRemoving }] =
    ClusterAPI.useRemoveClusterMutation()
  const [removeProvision, { isLoading: isRemovingProvision }] =
    ProvisionAPI.useRemoveProvisionMutation()
  const [deprovision, { isLoading: isDeprovisioning }] =
    ProvisionAPI.useUndeployProvisionMutation()
  const [retryProvision, { isLoading: isRetryingProvision }] =
    ProvisionAPI.useRetryProvisionMutation()

  const cluster =
    String(refreshedCluster?.ID) === String(selectedCluster?.ID)
      ? refreshedCluster
      : selectedCluster

  const { ID, NAME, HOSTS, VNETS, DATASTORES, TEMPLATE = {} } = cluster || {}

  const handleRefresh = async () =>
    ID !== undefined && refreshCluster({ id: ID })

  const handleRename = async (newName) => {
    await rename({ id: ID, name: newName })
    await handleRefresh()
  }

  const handleEdit = () => {
    history.push(PATH.INFRASTRUCTURE.CLUSTERS.CREATE, cluster)
  }

  const handleOpenDeprovisionForm = () =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title: T.Deprovision,
        description: (
          <ResourceActionConfirmation
            description={T['resource.deprovision.confirmation']}
            resources={cluster}
            resourceType={T.Clusters}
          />
        ),
        confirmLabel: T.Deprovision,
      },
      onSubmit: async () => {
        await deprovision({ id: TEMPLATE?.ONEFORM?.PROVISION_ID })
        enqueueSuccess(T.SuccessProvisionDeleted)
        await handleRefresh()
      },
    })

  const handleOpenRetryForm = () =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title: T.Retry,
        description: (
          <ResourceActionConfirmation
            description={T['resource.retry.confirmation']}
            resources={cluster}
            resourceType={T.Clusters}
          />
        ),
        confirmLabel: T.Retry,
      },
      onSubmit: async () => {
        await retryProvision({ id: TEMPLATE?.ONEFORM?.PROVISION_ID }).unwrap()
        enqueueSuccess(T.SuccessProvisionRetried)
        history.push(
          generatePath(PATH.INFRASTRUCTURE.CLUSTERS.CREATE_CLOUD_LOGS, {
            id: TEMPLATE?.ONEFORM?.PROVISION_ID,
          }),
          {
            operation: CLUSTER_CLOUD_OPERATIONS.RETRY.name,
          }
        )
      },
    })

  const handleOpenDeleteForm = () =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title: `${T.Delete} ${T.Cluster}`,
        dataCy: 'modal-delete',
        description: (
          <ResourceActionConfirmation
            description={T['resource.delete.confirmation']}
            resources={cluster}
            resourceType={T.Clusters}
          />
        ),
        confirmLabel: T.Delete,
        confirmButtonProps: {
          isDestructive: true,
        },
      },
      onSubmit: async () => {
        const deleteProvisionId = TEMPLATE?.ONEFORM?.PROVISION_ID

        if (deleteProvisionId) {
          await removeProvision({ id: deleteProvisionId, force: true })
        } else {
          await remove({ id: ID })
        }

        enqueueSuccess(T.SuccessClusterDeleted)
        handleClose()
      },
    })

  const isActionsDisabled =
    ID === undefined ||
    isFetching ||
    isRenaming ||
    isRemoving ||
    isRemovingProvision ||
    isDeprovisioning ||
    isRetryingProvision

  const informationActions = getActionsAvailable(
    getResourceView(RESOURCE_NAMES.CLUSTER)?.['info-tabs']?.info
      ?.information_panel?.actions
  )

  const isProvisionCluster = !!TEMPLATE?.ONEFORM
  const provisionId = TEMPLATE?.ONEFORM?.PROVISION_ID
  const canRename = informationActions?.includes?.(CLUSTER_ACTIONS.RENAME)
  const canUpdate =
    actions?.includes?.(CLUSTER_ACTIONS.UPDATE_DIALOG) && !isProvisionCluster
  const canDeprovision =
    actions?.includes?.(PROVISION_ACTIONS.DEPROVISION) &&
    isProvisionCluster &&
    provisionId !== undefined
  const canRetry =
    actions?.includes?.(PROVISION_ACTIONS.RETRY) &&
    isProvisionCluster &&
    provisionId !== undefined
  const canDelete = actions?.includes?.(CLUSTER_ACTIONS.DELETE)

  return (
    <DetailsDrawer
      isOpen={isOpen}
      slots={[
        [
          InfoSlot,
          {
            isTitleEditable: canRename,
            onTitleChange: handleRename,
            isTitleEditDisabled: !canRename || isActionsDisabled,
            title: NAME,
            id: ID,
            tags: getLabelTags(cluster?.LABELS),
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
                      canDeprovision && {
                        startIcon: <CloudDesync width="16px" height="16px" />,
                        onClick: handleOpenDeprovisionForm,
                        value: PROVISION_ACTIONS.DEPROVISION,
                        tooltip: T.Deprovision,
                        isDisabled: isActionsDisabled,
                      },
                      canRetry && {
                        startIcon: <Restart width="16px" height="16px" />,
                        onClick: handleOpenRetryForm,
                        value: PROVISION_ACTIONS.RETRY,
                        tooltip: T.Retry,
                        isDisabled: isActionsDisabled,
                      },
                    ].filter(Boolean),
                    [
                      {
                        ...getLabelMenuButtonProps({
                          selectedRows: [cluster],
                          resourceType: RESOURCE_NAMES.CLUSTER,
                          isDisabled: isActionsDisabled,
                        }),
                      },
                      {
                        startIcon: <Edit width="16px" height="16px" />,
                        onClick: handleEdit,
                        value: 'edit',
                        'data-cy': 'action-update_dialog',
                        tooltip: T.Update,
                        isDisabled: !canUpdate || isActionsDisabled,
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
                      {
                        startIcon: (
                          <Trash
                            width="16px"
                            height="16px"
                            style={{
                              color:
                                !canDelete || isActionsDisabled
                                  ? palette.text.disabled
                                  : palette.icon.error,
                            }}
                          />
                        ),
                        onClick: handleOpenDeleteForm,
                        value: 'delete',
                        'data-cy': 'action-cluster_delete',
                        tooltip: T.Delete,
                        isDestructive: true,
                        isDisabled: !canDelete || isActionsDisabled,
                      },
                      {
                        startIcon: <Cancel width="16px" height="16px" />,
                        onClick: handleClose,
                        value: 'close',
                        tooltip: T.Close,
                      },
                    ],
                  ].filter(({ length }) => length > 0)}
                />
              </Box>
            ),
          },
        ],
        [
          SummarySlot,
          {
            labels: [
              [T.Hosts, String(getTotalOfResources(HOSTS))],
              [T.Networks, String(getTotalOfResources(VNETS))],
              [T.Datastores, String(getTotalOfResources(DATASTORES))],
            ],
          },
        ],
        [
          TabSlot,
          {
            tabs: Cluster.Tabs.getSingleTabs({ isProvisionCluster }),
            resourceId: Cluster.RID,
            tabProps: {
              selected: cluster,
              handleRefresh,
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
  selectedCluster: PropTypes.object,
  handleClose: PropTypes.func,
  handleSelect: PropTypes.func,
  handleDeselect: PropTypes.func,
  actions: PropTypes.array,
}
