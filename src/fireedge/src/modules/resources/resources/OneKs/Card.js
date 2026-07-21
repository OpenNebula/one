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
import { Component, forwardRef, useMemo } from 'react'
import PropTypes from 'prop-types'
import { Card, MetadataSlot, TimeSlot, TitleSlot } from '@ComponentsV2Module'
import { getVirtualOneKsState } from '@ModelsModule'

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - OneKs data
 * @param {boolean} root0.isSelected - Whether card is selected
 * @param {Function} root0.onCheck - Check handler
 * @param {Function} root0.onClick - Click handler
 * @param {object} ref - Forwarded ref
 * @returns {Component} OneKs card component
 */
export const OneKsCard = forwardRef(
  ({ data, isSelected, onCheck, onClick }, ref) => {
    const { ID, NAME, UNAME, GNAME, TEMPLATE = {} } = data || {}
    const { CLUSTER_BODY = {} } = TEMPLATE
    const { kubernetes_version: version, node_groups: nodeGroups = [] } =
      CLUSTER_BODY

    const { color: stateColor, name: stateName } = useMemo(
      () => getVirtualOneKsState(data),
      [data]
    )

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
                [T.KubernetesVersion, version ?? '-'],
                [T.NodeGroups, String(nodeGroups?.length ?? 0)],
              ],
            },
          ],
          CLUSTER_BODY?.registration_time && [
            TimeSlot,
            {
              time: CLUSTER_BODY.registration_time,
              label: T.Created,
            },
          ],
        ]}
      />
    )
  }
)

OneKsCard.propTypes = {
  data: PropTypes.object,
  isSelected: PropTypes.bool,
  onCheck: PropTypes.func,
  onClick: PropTypes.func,
}

OneKsCard.displayName = 'OneKsCard'
