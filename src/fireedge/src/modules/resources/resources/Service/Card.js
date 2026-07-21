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

import { Component, forwardRef } from 'react'
import PropTypes from 'prop-types'
import { T } from '@ConstantsModule'
import {
  Card,
  IconSlot,
  LabelSlot,
  MetadataSlot,
  TitleSlot,
  TimeSlot,
} from '@ComponentsV2Module'
import {
  getLabelSlotLabels,
  getServiceState,
  getServiceTotalNetworks,
  getServiceTotalRoles,
  getServiceTotalVms,
} from '@ModelsModule'

/**
 * ServiceCard component displays a Service as a card.
 *
 * @param {object} root0 - Params
 * @param {object} root0.service - Service data
 * @param {boolean} root0.isSelected - Whether card is selected
 * @param {Function} root0.onCheck - Check handler
 * @param {Function} root0.onClick - Click handler
 * @param {object} ref - Forwarded ref
 * @returns {Component} Service card component
 */
export const ServiceCard = forwardRef(
  ({ service = {}, isSelected, onCheck, onClick }, ref) => {
    const {
      ID,
      NAME,
      UNAME,
      GNAME,
      TEMPLATE: {
        BODY: { registration_time: regTime, start_time: startTime },
      } = { BODY: {} },
    } = service
    const serviceState = getServiceState(service) ?? {}
    const registeredTime = regTime ?? startTime
    const labelSlotLabels = getLabelSlotLabels(service?.LABELS)

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
              status: serviceState?.color,
              statusName: serviceState?.displayName,
            },
          ],
          [
            MetadataSlot,
            {
              labels: [
                [T.ID, String(ID)],
                [T.Owner, UNAME],
                [T.Group, GNAME],
              ].filter(Boolean),
            },
          ],
          [
            IconSlot,
            {
              roles: getServiceTotalRoles(service) ?? 0,
              vms: getServiceTotalVms(service) ?? 0,
              networks: getServiceTotalNetworks(service) ?? 0,
            },
          ],
          labelSlotLabels.length > 0 && [
            LabelSlot,
            {
              labels: labelSlotLabels,
              max: 3,
            },
          ],
          registeredTime && [
            TimeSlot,
            { time: registeredTime, label: T.Created },
          ],
        ].filter(Boolean)}
      />
    )
  }
)

ServiceCard.propTypes = {
  service: PropTypes.object,
  isSelected: PropTypes.bool,
  onCheck: PropTypes.func,
  onClick: PropTypes.func,
}

ServiceCard.displayName = 'ServiceCard'
