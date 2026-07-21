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
import { RESOURCE_NAMES, STYLE_BUTTONS, T } from '@ConstantsModule'
import { VdcAPI, useModalsApi } from '@FeaturesModule'
import {
  getVdcClustersCount,
  getVdcDatastoresCount,
  getVdcGroupsCount,
  getVdcHostsCount,
  getVdcVnetsCount,
} from '@ModelsModule'
import { Vdc } from '@ResourcesModule'
import { Box } from '@mui/material'
import { Cancel, Trash } from 'iconoir-react'
import PropTypes from 'prop-types'
import { Component, useMemo } from 'react'

const aggregateCount = (items = [], getCount) => {
  const counts = items.map(getCount)

  return counts.some((count) => count === T.All)
    ? T.All
    : counts.reduce((total, count) => total + Number(count || 0), 0)
}

/**
 * @param {object} root0 - Params
 * @param {boolean} root0.isOpen - Is open
 * @param {Array} root0.selectedVdcs - Selected VDCs
 * @param {Function} root0.handleClose - Handle close
 * @returns {Component} - Aggregated view details drawer
 */
export const AggregatedView = ({
  isOpen = false,
  selectedVdcs = [],
  handleClose,
}) => {
  const { showModal } = useModalsApi()
  const [remove, { isLoading: isRemoving }] = VdcAPI.useRemoveVDCMutation()

  const selectedIds = useMemo(
    () =>
      selectedVdcs
        .map(({ ID }) => ID)
        .filter((id) => id !== undefined && id !== null),
    [selectedVdcs]
  )

  const totals = useMemo(
    () => ({
      groups: aggregateCount(selectedVdcs, getVdcGroupsCount),
      clusters: aggregateCount(selectedVdcs, getVdcClustersCount),
      hosts: aggregateCount(selectedVdcs, getVdcHostsCount),
      datastores: aggregateCount(selectedVdcs, getVdcDatastoresCount),
      vnets: aggregateCount(selectedVdcs, getVdcVnetsCount),
    }),
    [selectedVdcs]
  )

  const handleOpenDeleteForm = () =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title: [T.Delete, T.VDCs].filter(Boolean).join(' '),
        description: (
          <ResourceActionConfirmation
            description={T['resource.delete.confirmation']}
            resources={selectedIds.map((id) => ({ ID: id }))}
            resourceType={T.VDCs}
          />
        ),
        confirmLabel: T.Delete,
        confirmButtonProps: {
          isDestructive: true,
        },
      },
      onSubmit: async () => {
        await Promise.all(selectedIds.map((id) => remove({ id })))
        handleClose()
      },
    })

  const isMutating = isRemoving

  return (
    <DetailsDrawer
      isOpen={isOpen}
      slots={[
        [
          InfoSlot,
          {
            title: `${selectedVdcs?.length} ${T.VDCs} ${T.Selected}`,
            Toolbar: () => (
              <Box
                sx={(theme) => ({
                  display: 'flex',
                  flexDirection: 'row',
                  gap: `${theme.scale[500]}px`,
                })}
              >
                <LabelButton
                  selectedRows={selectedVdcs}
                  resourceType={RESOURCE_NAMES.VDC}
                  isDisabled={isMutating || !selectedIds.length}
                />
                <Button
                  type={STYLE_BUTTONS.TYPE.PRIMARY}
                  size="small"
                  startIcon={<Trash width={'16px'} height={'16px'} />}
                  onClick={handleOpenDeleteForm}
                  isDestructive
                  isDisabled={isMutating || !selectedIds.length}
                >
                  {T.DeleteSelected}
                </Button>
                <Button
                  type={STYLE_BUTTONS.TYPE.TRANSPARENT}
                  size="small"
                  iconOnly={<Cancel width="16px" height="16px" />}
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
              [totals.groups, T.Groups],
              [totals.clusters, T.Clusters],
              [totals.hosts, T.Hosts],
              [totals.datastores, T.Datastores],
              [totals.vnets, T.Vnets],
            ],
          },
        ],
        [
          TabSlot,
          {
            tabs: Vdc.Tabs.Aggregated,
            resourceId: Vdc.RID,
            tabProps: {
              selected: selectedVdcs,
            },
          },
          { flex: '1 1 0', minHeight: 0 },
        ],
      ]}
    />
  )
}

AggregatedView.displayName = 'AggregatedView'

AggregatedView.propTypes = {
  isOpen: PropTypes.bool,
  selectedVdcs: PropTypes.array,
  handleClose: PropTypes.func,
}
