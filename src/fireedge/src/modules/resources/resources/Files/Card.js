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
import {
  Card,
  IconSlot,
  LabelSlot,
  MetadataSlot,
  TimeSlot,
  TitleSlot,
} from '@ComponentsV2Module'
import { getBackupRunningVms, getImageState, getLabelTags } from '@ModelsModule'
import { getImageTypeLabel, getLockIcon, prettyBytes } from '@UtilsModule'

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - File data
 * @param {boolean} root0.isSelected - Whether card is selected
 * @param {Function} root0.onCheck - Check handler
 * @param {Function} root0.onClick - Click handler
 * @param {object} ref - Forwarded ref
 * @returns {Component} File card component
 */
export const FileCard = forwardRef(
  ({ data, isSelected, onCheck, onClick }, ref) => {
    const { ID, NAME, UNAME, GNAME, REGTIME, PERSISTENT, DATASTORE, SIZE } =
      data || {}

    const { color: stateColor, name: stateName } = useMemo(
      () => getImageState(data),
      [data]
    )

    const type = useMemo(() => getImageTypeLabel(data), [data])
    const vms = useMemo(() => getBackupRunningVms(data), [data])
    const labelTags = getLabelTags(data?.LABELS)

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
              title: (
                <>
                  {NAME} {getLockIcon(data)}
                </>
              ),
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
                [T.Datastore, DATASTORE ?? '-'],
              ],
            },
          ],
          [
            IconSlot,
            {
              vms,
              size: prettyBytes(+SIZE || 0, 'MB'),
            },
          ],
          (type || +PERSISTENT || labelTags.length > 0) && [
            LabelSlot,
            {
              labels: [
                type && [type, 'default'],
                +PERSISTENT && [T.Persistent, 'information'],
              ].filter(Boolean),
              tags: labelTags,
              max: 3,
            },
          ],
          [TimeSlot, { time: REGTIME, label: T.Registered }],
        ].filter(Boolean)}
      />
    )
  }
)

FileCard.propTypes = {
  data: PropTypes.object,
  isSelected: PropTypes.bool,
  onCheck: PropTypes.func,
  onClick: PropTypes.func,
}

FileCard.displayName = 'FileCard'
