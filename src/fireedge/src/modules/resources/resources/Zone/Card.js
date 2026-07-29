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

import { T } from '@ConstantsModule'
import { Component, forwardRef } from 'react'
import PropTypes from 'prop-types'
import { getLabelSlotLabels, getZoneState } from '@ModelsModule'
import { Card, LabelSlot, TitleSlot, MetadataSlot } from '@ComponentsV2Module'

/**
 * HostCard component displays a Host as a card.
 *
 * @param {object} params - Input parameters
 * @param {boolean} params.zone - Zone data
 * @param {boolean} params.isSelected - Whether card is selected
 * @param {Function} params.onCheck - Check handler
 * @param {Function} params.onClick - Click handler
 * @param {object} ref - Forwarded ref
 * @returns {Component} HostCard component
 */
export const ZoneCard = forwardRef(
  ({ zone, isSelected, onCheck, onClick }, ref) => {
    // Get the data from the host to display the card
    const { ID, NAME, TEMPLATE: { ENDPOINT, ENDPOINT_GRPC } = {} } = zone
    const { name: stateName, color: stateColor } = getZoneState(zone) ?? {}
    const labelSlotLabels = getLabelSlotLabels(zone?.LABELS)

    return (
      <Card
        ref={ref}
        onCheck={onCheck}
        onClick={onClick}
        isSelected={isSelected}
        slots={[
          [
            TitleSlot,
            {
              title: NAME,
              status: stateColor,
              statusName: stateName,
            },
          ],
          [
            MetadataSlot,
            {
              labels: [
                [T.ID, ID],
                [T.Endpoint, ENDPOINT],
                [T.EndpointGRPC, ENDPOINT_GRPC],
              ],
            },
          ],
          labelSlotLabels.length > 0 && [
            LabelSlot,
            {
              labels: labelSlotLabels,
            },
          ],
        ].filter(Boolean)}
      />
    )
  }
)

ZoneCard.propTypes = {
  zone: PropTypes.object,
  isSelected: PropTypes.bool,
  onCheck: PropTypes.func,
  onClick: PropTypes.func,
}

ZoneCard.displayName = 'ZoneCard'
