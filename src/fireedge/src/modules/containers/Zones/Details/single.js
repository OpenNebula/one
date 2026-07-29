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
  ToggleGroup,
  StatusTag,
} from '@ComponentsV2Module'

import { Box } from '@mui/material'
import { Component } from 'react'
import PropTypes from 'prop-types'
import { Cancel, RefreshDouble } from 'iconoir-react'
import { RESOURCE_NAMES, T } from '@ConstantsModule'
import { ZoneAPI } from '@FeaturesModule'
import { getLabelTags, getZoneState } from '@ModelsModule'
import { Zone } from '@ResourcesModule'

/**
 * @param {object} root0 - Params
 * @param {boolean} root0.isOpen - Is isOpen
 * @param {object} root0.selectedZone - Selected Zone
 * @param {Function} root0.handleClose - Handle close
 * @returns {Component} - Single view details drawer
 */
export const SingleView = ({
  isOpen = false,
  selectedZone = {},
  handleClose,
}) => {
  const [
    refreshZone,
    { data: refreshedZone = {}, isFetching: isRefreshingZone },
  ] = ZoneAPI.useLazyGetZoneQuery()

  const [rename, { isLoading: isRenaming }] = ZoneAPI.useRenameZoneMutation()

  const zone =
    String(refreshedZone?.ID) === String(selectedZone?.ID)
      ? refreshedZone
      : selectedZone

  const { name: stateName, color: stateColor } = getZoneState(zone) ?? {}

  const handleRefresh = () => zone?.ID !== undefined && refreshZone(zone.ID)

  const handleRename = async (newName) => {
    await rename({ id: selectedZone?.ID, name: newName })
  }

  const isActionsDisabled = isRenaming || isRefreshingZone

  return (
    <DetailsDrawer
      isOpen={isOpen}
      slots={[
        [
          InfoSlot,
          {
            isTitleEditable: true,
            onTitleChange: handleRename,
            isTitleEditDisabled: isRenaming,
            title: zone?.NAME,
            id: zone?.ID,
            tags: getLabelTags(zone?.LABELS),
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
                          selectedRows: [zone],
                          resourceType: RESOURCE_NAMES.ZONE,
                          isDisabled: isActionsDisabled,
                        }),
                      },
                      {
                        startIcon: <RefreshDouble width="16px" height="16px" />,
                        onClick: handleRefresh,
                        value: 'refresh',
                        isDisabled: isActionsDisabled,
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
                <StatusTag
                  key="host-state"
                  statusName={stateName ?? '-'}
                  statusColor={stateColor}
                />,
                T.State,
              ],
              [zone?.TEMPLATE?.ENDPOINT, T.Endpoint],
              [zone?.TEMPLATE?.ENDPOINT_GRPC, T.EndpointGRPC],
            ],
          },
        ],
        [
          TabSlot,
          {
            tabs: Zone.Tabs.Single,
            resourceId: Zone.RID,
            tabProps: {
              selected: selectedZone,
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
  selectedZone: PropTypes.object,
  handleClose: PropTypes.func,
}
