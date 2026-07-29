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
  TitleSlot,
  MetadataSlot,
  TimeSlot,
} from '@ComponentsV2Module'
import {
  getLabelSlotLabels,
  getServiceTotalNetworks,
  getServiceTotalRoles,
} from '@ModelsModule'

/**
 * ServiceTemplateCard component displays a Service Template as a card.
 *
 * @param {object} root0 - Params
 * @param {string} root0.NAME - Template name
 * @param {string} root0.ID - Template ID
 * @param {string} root0.GNAME - Group name
 * @param {string} root0.UNAME - Owner name
 * @param {string|number} root0.REGTIME - Registration time
 * @param {boolean} root0.isSelected - Whether card is selected
 * @param {Function} root0.onCheck - Check handler
 * @param {Function} root0.onClick - Click handler
 * @param {object} ref - Forwarded ref
 * @returns {Component} ServiceTemplateCard component
 */
export const ServiceTemplateCard = forwardRef(
  (
    {
      NAME,
      ID,
      GNAME,
      UNAME,
      REGTIME,
      LABELS,
      TEMPLATE,
      isSelected,
      onCheck,
      onClick,
    },
    ref
  ) => {
    const labelSlotLabels = getLabelSlotLabels(LABELS)
    const registrationTime = TEMPLATE?.BODY?.registration_time ?? REGTIME
    const serviceTemplate = { TEMPLATE }

    return (
      <Card
        ref={ref}
        onCheck={onCheck}
        onClick={onClick}
        isSelected={isSelected}
        slots={[
          [TitleSlot, { title: NAME }],
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
              roles: getServiceTotalRoles(serviceTemplate) ?? 0,
              networks: getServiceTotalNetworks(serviceTemplate) ?? 0,
            },
          ],
          labelSlotLabels.length > 0 && [
            LabelSlot,
            {
              labels: labelSlotLabels,
              max: 3,
            },
          ],
          registrationTime && [
            TimeSlot,
            { time: registrationTime, label: T.Registered },
          ],
        ].filter(Boolean)}
      />
    )
  }
)

ServiceTemplateCard.propTypes = {
  NAME: PropTypes.string,
  ID: PropTypes.string,
  GNAME: PropTypes.string,
  UNAME: PropTypes.string,
  REGTIME: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  LABELS: PropTypes.object,
  TEMPLATE: PropTypes.object,
  isSelected: PropTypes.bool,
  onCheck: PropTypes.func,
  onClick: PropTypes.func,
}

ServiceTemplateCard.displayName = 'ServiceTemplateCard'
