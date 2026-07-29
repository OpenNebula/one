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
import {
  Card,
  LabelSlot,
  MetadataSlot,
  TimeSlot,
  TitleSlot,
} from '@ComponentsV2Module'
import { Component, forwardRef } from 'react'
import { getLabelTags, getLogoSource } from '@ModelsModule'
import PropTypes from 'prop-types'

const toArray = (value) =>
  Array.isArray(value)
    ? value
    : value && typeof value === 'object'
    ? Object.values(value)
    : [value].filter(Boolean)
/**
 * ProviderCard component displays a Provider as a card.
 *
 * @param {object} root0 - Params
 * @param {string|number} root0.ID - Provider ID
 * @param {string} root0.NAME - Provider name
 * @param {object} root0.TEMPLATE - Provider template
 * @param {boolean} root0.isSelected - Whether card is selected
 * @param {Function} root0.onCheck - Check handler
 * @param {Function} root0.onClick - Click handler
 * @param {object} ref - Forwarded ref
 * @returns {Component} ProviderCard component
 */
export const ProviderCard = forwardRef(
  ({ provider, isSelected, onCheck, onClick }, ref) => {
    const { ID, NAME, UNAME, GNAME, TEMPLATE = {} } = provider ?? {}
    const providerBody =
      TEMPLATE?.PROVIDER_BODY && typeof TEMPLATE.PROVIDER_BODY === 'object'
        ? TEMPLATE.PROVIDER_BODY
        : {}
    const registrationTime = providerBody?.registration_time
    const numberOfProvisions = toArray(providerBody?.provision_ids).length
    const driver = providerBody?.driver ?? TEMPLATE?.DRIVER
    const labelTags = getLabelTags(provider?.LABELS)

    return (
      <Card
        ref={ref}
        onCheck={onCheck}
        onClick={onClick}
        isSelected={isSelected}
        icon={getLogoSource(providerBody?.fireedge)}
        iconAspectRatio="1 / 1"
        slots={[
          [TitleSlot, { title: NAME }],
          [
            MetadataSlot,
            {
              labels: [
                [T.ID, ID],
                [T.Owner, UNAME],
                [T.Group, GNAME],
                [T.AssociatedProvisions, String(numberOfProvisions)],
              ].filter(([, value]) => value),
            },
          ],
          (driver || labelTags.length > 0) && [
            LabelSlot,
            {
              labels: [driver && [driver, 'default']].filter(Boolean),
              tags: labelTags,
              max: 3,
            },
          ],
          [
            TimeSlot,
            {
              time: registrationTime,
              label: T.Registered,
            },
          ],
        ]}
      />
    )
  }
)

ProviderCard.propTypes = {
  provider: PropTypes.shape({
    ID: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    NAME: PropTypes.string,
    UNAME: PropTypes.string,
    GNAME: PropTypes.string,
    LABELS: PropTypes.object,
    TEMPLATE: PropTypes.object,
  }),
  isSelected: PropTypes.bool,
  onCheck: PropTypes.func,
  onClick: PropTypes.func,
}

ProviderCard.displayName = 'ProviderCard'
