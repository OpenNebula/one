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

import { T, Ticket } from '@ConstantsModule'
import { Card, MetadataSlot, TitleSlot, TimeSlot } from '@ComponentsV2Module'
import { Component, forwardRef } from 'react'
import { getSupportState } from '@ModelsModule'
import { isoDateToMilliseconds } from '@UtilsModule'
import PropTypes from 'prop-types'

/**
 * SupportCard component displays a support ticket as a card.
 *
 * @param {object} root0 - Params
 * @param {Ticket} root0.ticket - Support ticket
 * @param {boolean} root0.isSelected - Whether card is selected
 * @param {Function} root0.onCheck - Check handler
 * @param {Function} root0.onClick - Click handler
 * @param {object} ref - Forwarded ref
 * @returns {Component} SupportCard component
 */
export const SupportCard = forwardRef(
  ({ ticket = {}, isSelected, onCheck, onClick }, ref) => {
    const { id, subject, created_at: createdAt } = ticket
    const { color: stateColor, name: stateName } = getSupportState(ticket) ?? {}

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
              title: subject ?? String(id ?? ''),
              status: stateColor,
              statusName: stateName,
            },
          ],
          [
            MetadataSlot,
            {
              labels: [[T.ID, String(id ?? '')]].filter(Boolean),
            },
          ],
          [
            TimeSlot,
            {
              time: isoDateToMilliseconds(createdAt),
              label: T.Created,
            },
          ],
        ]}
      />
    )
  }
)

SupportCard.propTypes = {
  ticket: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    subject: PropTypes.string,
    created_at: PropTypes.string,
    status: PropTypes.string,
  }),
  isSelected: PropTypes.bool,
  onCheck: PropTypes.func,
  onClick: PropTypes.func,
}

SupportCard.displayName = 'SupportCard'
