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
} from '@modules/componentsv2/composed/Cards'
import { timeFromMilliseconds } from '@UtilsModule'

/**
 * VmTemplateCard component displays a VM Template as a card.
 *
 * @param {object} root0 - Params
 * @param {string} root0.NAME - Template name
 * @param {string} root0.ID - Template ID
 * @param {string} root0.GNAME - Group name
 * @param {string} root0.UNAME - Owner name
 * @param {string} root0.REGTIME - Registration time
 * @param {boolean|object} root0.LOCK - Lock status
 * @param {string} root0.LOGO - Template logo path
 * @param {boolean} root0.isSelected - Whether card is selected
 * @param {Function} root0.onCheck - Check handler
 * @param {Function} root0.onClick - Click handler
 * @param {object} ref - Forwarded ref
 * @returns {Component} VmTemplateCard component
 */
export const VmTemplateCard = forwardRef(
  (
    {
      NAME,
      ID,
      GNAME,
      UNAME,
      REGTIME,
      LOCK,
      LOGO = DEFAULT_TEMPLATE_LOGO,
      isSelected,
      onCheck,
      onClick,
    },
    ref
  ) => (
    <Card
      ref={ref}
      onCheck={onCheck}
      onClick={onClick}
      isSelected={isSelected}
      icon={`${STATIC_FILES_URL}/${LOGO}`}
      slots={[
        [TitleSlot, { title: NAME, status: !LOCK ? 'success' : 'disabled' }],
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
      ]}
    />
  )
)

VmTemplateCard.propTypes = {
  NAME: PropTypes.string,
  ID: PropTypes.string,
  GNAME: PropTypes.string,
  UNAME: PropTypes.string,
  REGTIME: PropTypes.string,
  LOCK: PropTypes.oneOfType([PropTypes.bool, PropTypes.object]),
  LOGO: PropTypes.string,
  isSelected: PropTypes.bool,
  onCheck: PropTypes.func,
  onClick: PropTypes.func,
}

VmTemplateCard.displayName = 'VmTemplateCard'
