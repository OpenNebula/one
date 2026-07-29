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
import {
  CLUSTER_ACTIONS,
  RESOURCE_NAMES,
  STYLE_BUTTONS,
  T,
} from '@ConstantsModule'
import { Cluster } from '@ResourcesModule'
import { getTotalOfResources } from '@UtilsModule'
import { Box, useTheme } from '@mui/material'
import { Component, useMemo } from 'react'
import PropTypes from 'prop-types'
import { Cancel as CloseIcon, Trash } from 'iconoir-react'
import {
  ClusterAPI,
  ProvisionAPI,
  useGeneralApi,
  useModalsApi,
} from '@FeaturesModule'

/**
 * @param {object} root0 - Params
 * @param {boolean} root0.isOpen - Is open
 * @param {Array} root0.selectedClusters - Selected clusters
 * @param {Function} root0.handleClose - Handle close
 * @param {Function} root0.handleSelect - Handle select
 * @param {Function} root0.handleDeselect - Handle deselect
 * @param {Array} root0.actions - Available actions
 * @returns {Component} - Aggregated clusters details drawer
 */
export const AggregatedView = ({
  isOpen = false,
  selectedClusters = [],
  handleClose,
  handleSelect,
  handleDeselect,
  actions = [],
}) => {
  const { palette } = useTheme()
  const { enqueueSuccess } = useGeneralApi()
  const { showModal } = useModalsApi()
  const [remove, { isLoading: isRemoving }] =
    ClusterAPI.useRemoveClusterMutation()
  const [removeProvision, { isLoading: isRemovingProvision }] =
    ProvisionAPI.useRemoveProvisionMutation()

  const isActionsDisabled =
    selectedClusters?.length === 0 || isRemoving || isRemovingProvision
  const canDelete = actions?.includes?.(CLUSTER_ACTIONS.DELETE)

  const handleDelete = () =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title: `${T.Delete} ${T.Clusters}`,
        description: (
          <ResourceActionConfirmation
            description={T['resource.delete.confirmation']}
            resources={selectedClusters}
            resourceType={T.Clusters}
          />
        ),
        confirmLabel: T.Delete,
        confirmButtonProps: {
          isDestructive: true,
        },
      },
      onSubmit: async () => {
        await Promise.all(
          selectedClusters.map(({ ID, TEMPLATE = {} }) => {
            const provisionId = TEMPLATE?.ONEFORM?.PROVISION_ID

            if (provisionId) {
              return removeProvision({ id: provisionId, force: true })
            }

            return remove({ id: ID })
          })
        )
        enqueueSuccess(T.SuccessClusterDeleted)
        handleClose()
      },
    })

  const summary = useMemo(
    () =>
      selectedClusters.reduce(
        (acc, cluster) => ({
          totalHosts: acc.totalHosts + getTotalOfResources(cluster?.HOSTS),
          totalDatastores:
            acc.totalDatastores + getTotalOfResources(cluster?.DATASTORES),
          totalVnets: acc.totalVnets + getTotalOfResources(cluster?.VNETS),
        }),
        { totalHosts: 0, totalDatastores: 0, totalVnets: 0 }
      ),
    [selectedClusters]
  )

  return (
    <DetailsDrawer
      isOpen={isOpen}
      slots={[
        [
          InfoSlot,
          {
            title: `${selectedClusters?.length} ${T.Clusters} ${T.Selected}`,
            Toolbar: () => (
              <Box
                sx={(theme) => ({
                  display: 'flex',
                  flexDirection: 'row',
                  gap: `${theme.scale[500]}px`,
                })}
              >
                <LabelButton
                  selectedRows={selectedClusters}
                  resourceType={RESOURCE_NAMES.CLUSTER}
                  isDisabled={isActionsDisabled}
                />
                {canDelete && (
                  <Button
                    type={STYLE_BUTTONS.TYPE.PRIMARY}
                    size="small"
                    startIcon={
                      <Trash
                        width="16px"
                        height="16px"
                        style={{
                          color: isActionsDisabled
                            ? palette.text.disabled
                            : palette.icon.error,
                        }}
                      />
                    }
                    tooltip={T.Delete}
                    onClick={handleDelete}
                    isDestructive
                    isDisabled={isActionsDisabled}
                  >
                    {T.DeleteSelected}
                  </Button>
                )}
                <Button
                  type={STYLE_BUTTONS.TYPE.TRANSPARENT}
                  size="small"
                  iconOnly={<CloseIcon width="16px" height="16px" />}
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
              [T.NumberOfHosts, String(summary.totalHosts)],
              [T.NumberOfDatastores, String(summary.totalDatastores)],
              [T.NumberOfVnets, String(summary.totalVnets)],
            ],
          },
        ],
        [
          TabSlot,
          {
            tabs: Cluster.Tabs.Aggregated,
            resourceId: Cluster.RID,
            tabProps: {
              selected: selectedClusters,
              handleSelect,
              handleDeselect,
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
  selectedClusters: PropTypes.array,
  handleClose: PropTypes.func,
  handleSelect: PropTypes.func,
  handleDeselect: PropTypes.func,
  actions: PropTypes.array,
}
