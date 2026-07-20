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

import { T, STATIC_FILES_URL, DEFAULT_TEMPLATE_LOGO } from '@ConstantsModule'
import { Component, forwardRef } from 'react'
import PropTypes from 'prop-types'
import {
  Card,
  TitleSlot,
  OwnershipSlot,
  MetadataSlot,
  LabelSlot,
} from '@ComponentsV2Module'
import { getLockIcon, timeFromMilliseconds } from '@UtilsModule'
import { getLabelSlotLabels } from '@ModelsModule'

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
    isSelected,
    onCheck,
    onClick,
  } = data
  const labelSlotLabels = getLabelSlotLabels(LABELS)

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
                {NAME} {getLockIcon(data)}
              </>
            ),
          },
        ],
        [
          OwnershipSlot,
          {
            labels: [
              ['ID', ID],
              ['Owner', UNAME],
              ['Group', GNAME],
            ],
          },
        ],
        [
          MetadataSlot,
          {
            labels: [
              [
                REGTIME &&
                  `${T.Registered} ${timeFromMilliseconds(
                    +REGTIME
                  ).toRelative()}`,
              ]?.filter(Boolean),
            ],
          },
        ],
        labelSlotLabels.length > 0 && [
          LabelSlot,
          {
            labels: labelSlotLabels,
          },
        ],
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
  isSelected: PropTypes.bool,
  onCheck: PropTypes.func,
  onClick: PropTypes.func,
}

VmTemplateCard.displayName = 'VmTemplateCard'
