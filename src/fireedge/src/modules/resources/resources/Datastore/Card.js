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

import { T, DS_THRESHOLD } from '@ConstantsModule'
import { Component, forwardRef, useMemo } from 'react'
import PropTypes from 'prop-types'
import {
  Card,
  TitleSlot,
  MetadataSlot,
  ProgressBarSlot,
  LabelSlot,
} from '@ComponentsV2Module'
import {
  getDatastoreCapacityInfo,
  getDatastoreState,
  getDatastoreType,
  getLabelSlotLabels,
} from '@ModelsModule'

/**
 * VmTemplateCard component displays a VM Template as a card.
 *
 * @param {object} root0 - Params
 * @param {string} root0.NAME - Template name
 * @param {string} root0.ID - Template ID
 * @param {string} root0.GNAME - Group name
 * @param {string} root0.UNAME - Owner name
 * @param {string} root0.REGTIME - Registration time
 * @param {string} root0.LOGO - Template logo path
 * @param {boolean} root0.isSelected - Whether card is selected
 * @param {Function} root0.onCheck - Check handler
 * @param {Function} root0.onClick - Click handler
 * @param {object} ref - Forwarded ref
 * @returns {Component} VmTemplateCard component
 */
export const DatastoreCard = forwardRef(
  ({ data, isSelected, onCheck, onClick }, ref) => {
    const { color: stateColor, name: stateName } = useMemo(
      () => getDatastoreState(data),
      [data]
    )
    const capacity = useMemo(() => getDatastoreCapacityInfo(data), [data])
    const { percentOfUsed, percentLabel } = capacity
    const { ID, NAME, UNAME, GNAME, CLUSTERS } = data || {}
    const type = useMemo(() => getDatastoreType(data), [data])
    const labelSlotLabels = getLabelSlotLabels(data?.LABELS)

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
                ['ID', ID],
                ['Owner', UNAME],
                ['Group', GNAME],
                [T.Cluster, [CLUSTERS?.ID ?? []].flat().join(', ')],
              ],
            },
          ],
          [
            ProgressBarSlot,
            {
              bars: [
                {
                  label: `${percentLabel}`,
                  value: percentOfUsed,
                  isLabelVisible: true,
                  thresholds: [
                    DS_THRESHOLD.CAPACITY.low,
                    DS_THRESHOLD.CAPACITY.high,
                  ],
                },
              ],
            },
          ],
          [
            LabelSlot,
            {
              labels: [type && [type, 'default'], ...labelSlotLabels].filter(
                Boolean
              ),
            },
          ],
        ]}
      />
    )
  }
)

DatastoreCard.propTypes = {
  data: PropTypes.object,
  isSelected: PropTypes.bool,
  onCheck: PropTypes.func,
  onClick: PropTypes.func,
}

DatastoreCard.displayName = 'DatastoreCard'
