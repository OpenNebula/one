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
  LabelSlot,
  MetadataSlot,
  TimeSlot,
  TitleSlot,
} from '@ComponentsV2Module'
import { getNodeGroupState } from '@ModelsModule'

/**
 * Displays a OneKS Node Group as a selectable card.
 *
 * @param {object} root0 - Params
 * @param {object} root0.nodeGroup - Node Group data
 * @param {boolean} root0.isSelected - Whether card is selected
 * @param {Function} root0.onCheck - Check handler
 * @param {Function} root0.onClick - Click handler
 * @param {object} ref - Forwarded ref
 * @returns {Component} Node Group card component
 */
export const NodeGroupCard = forwardRef(
  ({ nodeGroup = {}, isSelected, onCheck, onClick }, ref) => {
    const {
      id,
      name,
      state,
      flavour,
      registration_time: registrationTime,
      vms = [],
    } = nodeGroup
    const { color, name: stateName } = getNodeGroupState(state) ?? {}
    const nodes = [].concat(vms).filter(Boolean).length

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
              title: name,
              status: color,
              statusName: stateName,
            },
          ],
          [
            MetadataSlot,
            {
              labels: [
                [T.ID, id === undefined || id === null ? undefined : `#${id}`],
                [T.Nodes, String(nodes)],
              ].filter(([, value]) => value !== undefined && value !== null),
            },
          ],
          flavour && [
            LabelSlot,
            {
              labels: [[flavour, 'default']],
            },
          ],
          registrationTime && [
            TimeSlot,
            {
              time: registrationTime,
              label: T.Created,
            },
          ],
        ].filter(Boolean)}
      />
    )
  }
)

NodeGroupCard.propTypes = {
  nodeGroup: PropTypes.object,
  isSelected: PropTypes.bool,
  onCheck: PropTypes.func,
  onClick: PropTypes.func,
}

NodeGroupCard.displayName = 'NodeGroupCard'
