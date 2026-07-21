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

import { T, HOST_THRESHOLD } from '@ConstantsModule'
import { Component, forwardRef } from 'react'
import PropTypes from 'prop-types'
import { getHostState, getAllocatedInfo, getLabelTags } from '@ModelsModule'
import {
  Card,
  LabelSlot,
  TitleSlot,
  MetadataSlot,
  ProgressBarSlot,
} from '@ComponentsV2Module'

/**
 * HostCard component displays a Host as a card.
 *
 * @param {object} params - Input parameters
 * @param {boolean} params.host - Host data
 * @param {string} params.dataCy - Data-cy attribute
 * @param {boolean} params.isSelected - Whether card is selected
 * @param {Function} params.onCheck - Check handler
 * @param {Function} params.onClick - Click handler
 * @param {object} ref - Forwarded ref
 * @returns {Component} HostCard component
 */
export const HostCard = forwardRef(
  ({ host, dataCy, isSelected, onCheck, onClick }, ref) => {
    // Get the data from the host to display the card
    const { CLUSTER, ID, IM_MAD, VM_MAD } = host
    const id = String(ID)
    const name = host?.NAME
    const { name: stateName, color: stateColor } = getHostState(host) ?? {}
    const { percentCpuLabel, percentCpuUsed, percentMemLabel, percentMemUsed } =
      getAllocatedInfo(host)
    const totalVms = [host?.VMS?.ID ?? []].flat().length || 0
    const runningVms = host?.HOST_SHARE?.RUNNING_VMS ?? 0
    const labelTags = getLabelTags(host?.LABELS)

    return (
      <Card
        ref={ref}
        dataCy={dataCy}
        onCheck={onCheck}
        onClick={onClick}
        isSelected={isSelected}
        slots={[
          [
            TitleSlot,
            {
              title: name,
              status: stateColor,
              statusName: stateName,
            },
          ],
          [
            MetadataSlot,
            {
              labels: [
                ['ID', id],
                [T.Cluster, CLUSTER],
                [T.IM_MAD, IM_MAD],
                [T.VM_MAD, VM_MAD],
                [T.RunningVMs, `${runningVms} / ${totalVms}`],
              ],
            },
          ],
          [
            ProgressBarSlot,
            {
              bars: [
                {
                  label: `${T.AllocatedCpu} ${percentCpuLabel}`,
                  value: percentCpuUsed,
                  isLabelVisible: true,
                  thresholds: [HOST_THRESHOLD.CPU.low, HOST_THRESHOLD.CPU.high],
                },
                {
                  label: `${T.AllocatedMemory} ${percentMemLabel}`,
                  value: percentMemUsed,
                  isLabelVisible: true,
                  thresholds: [
                    HOST_THRESHOLD.MEMORY.low,
                    HOST_THRESHOLD.MEMORY.high,
                  ],
                },
              ],
            },
          ],
          labelTags.length > 0 && [
            LabelSlot,
            {
              tags: labelTags,
              max: 3,
            },
          ],
        ].filter(Boolean)}
      />
    )
  }
)

HostCard.propTypes = {
  host: PropTypes.object,
  dataCy: PropTypes.string,
  isSelected: PropTypes.bool,
  onCheck: PropTypes.func,
  onClick: PropTypes.func,
}

HostCard.displayName = 'HostCard'
