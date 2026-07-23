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
import {
  Card,
  IconSlot,
  TitleSlot,
  MetadataSlot,
  LabelSlot,
  TimeSlot,
} from '@ComponentsV2Module'
import {
  T,
  UNITS,
  STATIC_FILES_URL,
  DEFAULT_TEMPLATE_LOGO,
} from '@ConstantsModule'
import {
  getIpAddresses,
  getDiskSize,
  getLabelTags,
  getLastHistory,
  getVirtualMachineState,
} from '@ModelsModule'
import { getLockIcon, prettyBytes } from '@UtilsModule'

/**
 * VirtualMachineCard component displays a Virtual Machine as a card.
 *
 * @param {object} root0 - Params
 * @param {string} root0.NAME - Machine name
 * @param {string} root0.ID - Machine ID
 * @param {string} root0.GNAME - Group name
 * @param {string} root0.UNAME - Owner name
 * @param {string} root0.STIME - Registration time
 * @param {boolean} root0.isSelected - Whether card is selected
 * @param {Function} root0.onCheck - Check handler
 * @param {Function} root0.onClick - Click handler
 * @param {object} ref - Forwarded ref
 * @returns {Component} VirtualMachineCard component
 */
export const VirtualMachineCard = forwardRef((data = {}, ref) => {
  const {
    NAME,
    ID,
    GNAME,
    UNAME,
    STIME,
    STATE,
    LCM_STATE,
    LABELS,
    TEMPLATE = {},
    USER_TEMPLATE,
    isSelected,
    onCheck,
    onClick,
  } = data
  const { name: statusName, color: status } = getVirtualMachineState({
    STATE,
    LCM_STATE,
  })
  const labelTags = getLabelTags(LABELS)
  const { HOSTNAME } = getLastHistory(data)
  const logo =
    USER_TEMPLATE?.LOGO ||
    USER_TEMPLATE?.USER_TEMPLATE?.LOGO ||
    TEMPLATE?.LOGO ||
    DEFAULT_TEMPLATE_LOGO
  const lockIcon = getLockIcon(data)

  return (
    <Card
      ref={ref}
      onCheck={onCheck}
      onClick={onClick}
      isSelected={isSelected}
      icon={`${STATIC_FILES_URL}/${logo}`}
      slots={[
        [
          TitleSlot,
          {
            title: (
              <>
                {NAME} {lockIcon}
              </>
            ),
            statusName,
            status,
          },
        ],
        [
          MetadataSlot,
          {
            labels: [
              [T.ID, ID],
              [T.Owner, UNAME],
              [T.Group, GNAME],
              [T.Host, HOSTNAME],
            ].filter(
              ([, value]) =>
                value !== undefined && value !== null && value !== ''
            ),
          },
        ],

        [
          IconSlot,
          {
            cpu: TEMPLATE?.CPU ?? 1,
            memory: prettyBytes(TEMPLATE?.MEMORY ?? 0, UNITS.MB),
            disk: prettyBytes(getDiskSize(data), UNITS.MB),
            ips: getIpAddresses(data),
          },
        ],

        labelTags.length > 0 && [
          LabelSlot,
          {
            tags: labelTags,
            max: 3,
          },
        ],

        STIME && [
          TimeSlot,
          {
            time: STIME,
            label: T.Created,
          },
        ],
      ]}
    />
  )
})

VirtualMachineCard.propTypes = {
  NAME: PropTypes.string,
  ID: PropTypes.string,
  GNAME: PropTypes.string,
  UNAME: PropTypes.string,
  STIME: PropTypes.string,
  LABELS: PropTypes.object,
  TEMPLATE: PropTypes.object,
  USER_TEMPLATE: PropTypes.object,
  HISTORY_RECORDS: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  STATE: PropTypes.string,
  LCM_STATE: PropTypes.string,
  isSelected: PropTypes.bool,
  onCheck: PropTypes.func,
  onClick: PropTypes.func,
}

VirtualMachineCard.displayName = 'VirtualMachineCard'
