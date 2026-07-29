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

import {
  T,
  UNITS,
  STATIC_FILES_URL,
  DEFAULT_TEMPLATE_LOGO,
} from '@ConstantsModule'
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
import { getLockIcon, prettyBytes } from '@UtilsModule'
import {
  getLabelTags,
  getVmTemplateImageCount,
  getVmTemplateNetworkCount,
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
export const VmTemplateCard = forwardRef((data = {}, ref) => {
  const {
    NAME,
    ID,
    GNAME,
    UNAME,
    REGTIME,
    LOGO = DEFAULT_TEMPLATE_LOGO,
    LABELS,
    TEMPLATE = {},
    isSelected,
    onCheck,
    onClick,
  } = data
  const labelTags = getLabelTags(LABELS)
  const lockIcon = getLockIcon(data)

  return (
    <Card
      ref={ref}
      dataCy={`template-${ID}`}
      onCheck={onCheck}
      onClick={onClick}
      isSelected={isSelected}
      icon={`${STATIC_FILES_URL}/${LOGO}`}
      slots={[
        [
          TitleSlot,
          {
            title: (
              <>
                {NAME} {lockIcon}
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
            cpu: TEMPLATE?.CPU ?? 1,
            memory: prettyBytes(TEMPLATE?.MEMORY ?? 0, UNITS.MB),
            images: getVmTemplateImageCount(data),
            networks: getVmTemplateNetworkCount(data),
          },
        ],
        (TEMPLATE?.HYPERVISOR ||
          TEMPLATE?.OS?.ARCH ||
          labelTags.length > 0) && [
          LabelSlot,
          {
            labels: [
              TEMPLATE?.HYPERVISOR && [TEMPLATE.HYPERVISOR, 'miscellaneous'],
              TEMPLATE?.OS?.ARCH && [TEMPLATE.OS.ARCH, 'miscellaneous2'],
            ].filter(Boolean),
            tags: labelTags,
            max: 2,
          },
        ],
        REGTIME && [TimeSlot, { time: REGTIME, label: T.Registered }],
      ].filter(Boolean)}
    />
  )
})

VmTemplateCard.propTypes = {
  NAME: PropTypes.string,
  ID: PropTypes.string,
  GNAME: PropTypes.string,
  UNAME: PropTypes.string,
  REGTIME: PropTypes.string,
  LOGO: PropTypes.string,
  LABELS: PropTypes.object,
  TEMPLATE: PropTypes.object,
  isSelected: PropTypes.bool,
  onCheck: PropTypes.func,
  onClick: PropTypes.func,
}

VmTemplateCard.displayName = 'VmTemplateCard'
