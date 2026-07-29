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
  SummarySlot,
  TabSlot,
} from '@ComponentsV2Module'

import { getZoneState } from '@ModelsModule'
import { Zone } from '@ResourcesModule'
import { Box } from '@mui/material'
import { Component, useMemo } from 'react'
import PropTypes from 'prop-types'
import { Cancel } from 'iconoir-react'
import { RESOURCE_NAMES, STYLE_BUTTONS, T } from '@ConstantsModule'
import { getCommonValue } from '@UtilsModule'

/**
 * @param {object} root0 - Params
 * @param {boolean} root0.isOpen - Is isOpen
 * @param {object[]} root0.selectedZones - Selected Zones
 * @param {Function} root0.handleClose - Handle close
 * @param {Function} root0.handleSelect - Handle select
 * @param {Function} root0.handleDeselect - Handle deselect
 * @returns {Component} - Aggregated view details drawer
 */
export const AggregatedView = ({
  isOpen = false,
  selectedZones = [],
  handleClose,
  handleSelect,
  handleDeselect,
}) => {
  const isActionsDisabled = selectedZones?.length === 0

  const summary = useMemo(
    () => ({
      state: getCommonValue(
        selectedZones,
        (zone) => getZoneState(zone)?.name ?? '-'
      ),
      endpoint: getCommonValue(
        selectedZones,
        (zone) => zone?.TEMPLATE?.ENDPOINT ?? '-'
      ),
      endpointGrpc: getCommonValue(
        selectedZones,
        (zone) => zone?.TEMPLATE?.ENDPOINT_GRPC ?? '-'
      ),
    }),
    [selectedZones]
  )

  return (
    <DetailsDrawer
      isOpen={isOpen}
      slots={[
        [
          InfoSlot,
          {
            title: `${selectedZones?.length} ${T.Zones} ${T.Selected}`,
            Toolbar: () => (
              <Box
                sx={(theme) => ({
                  display: 'flex',
                  flexDirection: 'row',
                  gap: `${theme.scale[500]}px`,
                })}
              >
                <LabelButton
                  selectedRows={selectedZones}
                  resourceType={RESOURCE_NAMES.ZONE}
                  isDisabled={isActionsDisabled}
                />
                <Button
                  type={STYLE_BUTTONS.TYPE.TRANSPARENT}
                  size="small"
                  iconOnly={<Cancel width="16px" height="16px" />}
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
              [summary.endpoint, T.Endpoint],
              [summary.endpointGrpc, T.EndpointGRPC],
            ]?.filter(([value]) => value !== undefined),
          },
        ],
        [
          TabSlot,
          {
            tabs: Zone.Tabs.Aggregated,
            resourceId: Zone.RID,
            tabProps: {
              selected: selectedZones,
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
  selectedZones: PropTypes.array,
  handleClose: PropTypes.func,
  handleSelect: PropTypes.func,
  handleDeselect: PropTypes.func,
}
