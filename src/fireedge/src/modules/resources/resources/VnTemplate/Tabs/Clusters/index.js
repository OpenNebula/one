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

import PropTypes from 'prop-types'
import { Component, useMemo } from 'react'
import { Box } from '@mui/material'
import { MoreVert } from 'iconoir-react'

import {
  Button,
  MenuButton,
  ResourceActionConfirmation,
  TablePanel,
} from '@ComponentsV2Module'
import { ChangeClusterForm } from '@modules/resources/resources/Cluster/Forms'
import { STYLE_BUTTONS, T, VN_TEMPLATE_ACTIONS } from '@ConstantsModule'
import { ClusterAPI, VnTemplateAPI, useModalsApi } from '@FeaturesModule'
import { getTotalOfResources, jsonToXml } from '@UtilsModule'

const getClusterIds = (vnTemplate) =>
  [vnTemplate?.TEMPLATE?.CLUSTER_IDS ?? [], vnTemplate?.TEMPLATE?.CLUSTER ?? []]
    .flat()
    .flatMap((clusterIds) => `${clusterIds}`.split(','))
    .filter(Boolean)
    .map((clusterId) => +clusterId)
    .filter(Number.isFinite)

const getTemplateWithClusters = (template = {}, clusterIds = []) => {
  const { CLUSTER: _cluster, CLUSTER_IDS: _clusterIds, ...rest } = template

  return clusterIds.length ? { ...rest, CLUSTER: clusterIds } : rest
}

const dialogWidth = {
  xs: 'calc(100vw - 32px)',
  md: '960px',
  lg: '1200px',
}

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab specific data
 * @param {object} root0.config - Tab view configuration
 * @returns {Component} - VN Templates clusters tab
 */
export const Clusters = ({ data, config }) => {
  const {
    vnTemplate = {},
    actions = [],
    handleRefresh,
    isActionsDisabled,
    isLocked,
  } = data || {}

  // API
  const { showModal } = useModalsApi()
  const { data: clusters = [], isFetching } = ClusterAPI.useGetClustersQuery()
  const [update, { isLoading: isUpdating }] =
    VnTemplateAPI.useUpdateVNTemplateMutation()

  // State
  const tabActions = config?.actions ?? {}
  const canChangeCluster =
    tabActions[VN_TEMPLATE_ACTIONS.CHANGE_CLUSTER] === true ||
    actions.includes(VN_TEMPLATE_ACTIONS.CHANGE_CLUSTER) ||
    config?.enabled === true
  const areActionsDisabled = isActionsDisabled || isLocked || isUpdating
  const clusterIds = useMemo(() => getClusterIds(vnTemplate), [vnTemplate])
  const templateClusters = useMemo(
    () => clusters.filter((cluster) => clusterIds.includes(+cluster.ID)),
    [clusters, clusterIds]
  )

  // Table
  const columns = [
    { accessorKey: 'ID', header: T.ID, grow: false },
    { accessorKey: 'NAME', header: T.Name, truncate: true },
    {
      id: 'hosts',
      header: T.Hosts,
      cell: ({ row }) => getTotalOfResources(row.original?.HOSTS),
    },
    {
      id: 'datastores',
      header: T.Datastores,
      cell: ({ row }) => getTotalOfResources(row.original?.DATASTORES),
    },
    {
      id: 'vnets',
      header: T.VirtualNetworks,
      cell: ({ row }) => getTotalOfResources(row.original?.VNETS),
    },
    {
      id: 'actions',
      header: '',
      grow: false,
      cell: ({ row }) => {
        const cluster = row.original

        return (
          <Box display="flex" justifyContent="flex-end">
            <MenuButton
              iconOnly={<MoreVert />}
              options={[
                [
                  {
                    title: T.Remove,
                    isDestructive: true,
                    isDisabled: !canChangeCluster || areActionsDisabled,
                    onClick: () => handleRemoveClusterForm(cluster),
                  },
                ],
              ]}
            />
          </Box>
        )
      },
    },
  ]

  // Actions
  const updateTemplateClusters = async (nextClusterIds) => {
    await update({
      id: vnTemplate?.ID,
      template: jsonToXml(
        getTemplateWithClusters(vnTemplate?.TEMPLATE, nextClusterIds)
      ),
    }).unwrap()
    await handleRefresh?.()
  }

  const handleSelectClusters = async ({ cluster }) => {
    const selectedClusterIds = [cluster].flat().filter(Boolean).map(String)

    await updateTemplateClusters(selectedClusterIds)
  }

  const handleRemoveCluster = async (clusterId) => {
    await updateTemplateClusters(
      clusterIds
        .map(String)
        .filter((currentClusterId) => currentClusterId !== String(clusterId))
    )
  }

  // Modals
  const handleSelectClustersForm = () =>
    showModal({
      dialogProps: {
        title: T.SelectClusters,
        dataCy: 'modal-select-template-clusters',
        dialogWidth,
        dialogMaxWidth: 'calc(100vw - 32px)',
        dialogContentMaxHeight: '70vh',
      },
      form: ChangeClusterForm({
        initialValues: clusterIds.map(String),
        stepProps: { singleSelect: false, isCopyColumn: true },
      }),
      onSubmit: handleSelectClusters,
    })

  const handleRemoveClusterForm = (cluster) =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title: `${T.Remove} ${T.Cluster}`,
        description: (
          <ResourceActionConfirmation
            description={T['resource.remove.confirmation']}
            resources={cluster}
            resourceType={T.Clusters}
          />
        ),
        confirmLabel: T.Remove,
        cancelLabel: T.Cancel,
        confirmButtonProps: {
          isDestructive: true,
        },
      },
      onSubmit: () => handleRemoveCluster(cluster?.ID),
    })

  return (
    <Box display="flex" flexDirection="column" gap="1em">
      {canChangeCluster && (
        <Box display="flex" justifyContent="flex-start">
          <Button
            type={STYLE_BUTTONS.TYPE.SECONDARY}
            size="small"
            onClick={handleSelectClustersForm}
            isDisabled={areActionsDisabled}
          >
            {T.SelectClusters}
          </Button>
        </Box>
      )}
      <TablePanel
        key="vn-template-clusters-table"
        columns={columns}
        data={templateClusters}
        isLoading={isFetching}
      />
    </Box>
  )
}

Clusters.propTypes = {
  data: PropTypes.object,
  config: PropTypes.object,
}

Clusters.id = 'cluster'
Clusters.title = T.Clusters
