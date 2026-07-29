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
  LabelSlot,
  TitleSlot,
  MetadataSlot,
} from '@ComponentsV2Module'
import { getLockIcon } from '@UtilsModule'
import {
  getLabelTags,
  getVmGroupTotalRoles,
  getVmGroupTotalVms,
} from '@ModelsModule'

/**
 * VmGroupCard component displays a VM Template as a card.
 *
 * @param {object} root0 - Params
 * @param {string} root0.NAME - Template name
 * @param {string} root0.ID - Template ID
 * @param {string} root0.GNAME - Group name
 * @param {string} root0.UNAME - Owner name
 * @param {string} root0.REGTIME - Registration time
 * @param {object|Array} root0.ROLES - VM Group roles
 * @param {boolean} root0.isSelected - Whether card is selected
 * @param {Function} root0.onCheck - Check handler
 * @param {Function} root0.onClick - Click handler
 * @param {object} ref - Forwarded ref
 * @returns {Component} VmGroupCard component
 */
export const VmGroupCard = forwardRef((data = {}, ref) => {
  const {
    NAME,
    ID,
    GNAME,
    UNAME,
    ROLES,
    LABELS,
    isSelected,
    onCheck,
    onClick,
  } = data
  const labelTags = getLabelTags(LABELS)

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
          },
        ],
        [
          MetadataSlot,
          {
            labels: [
              ['ID', ID],
              ['Owner', UNAME],
              ['Group', GNAME],
            ],
          },
        ],
        [
          IconSlot,
          {
            roles: getVmGroupTotalRoles({ ROLES }),
            vms: getVmGroupTotalVms({ ROLES }),
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
})

VmGroupCard.propTypes = {
  NAME: PropTypes.string,
  ID: PropTypes.string,
  GNAME: PropTypes.string,
  UNAME: PropTypes.string,
  REGTIME: PropTypes.string,
  ROLES: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  LABELS: PropTypes.object,
  isSelected: PropTypes.bool,
  onCheck: PropTypes.func,
  onClick: PropTypes.func,
}

VmGroupCard.displayName = 'VmGroupCard'
