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
import { Component, forwardRef } from 'react'
import PropTypes from 'prop-types'
import {
  Card,
  LabelSlot,
  MetadataSlot,
  TimeSlot,
  TitleSlot,
} from '@ComponentsV2Module'
import { getLabelTags } from '@ModelsModule'
import { getLockIcon } from '@UtilsModule'

/**
 * VnTemplatesCard component displays a VN Template as a card.
 *
 * @param {object} root0 - Params
 * @param {object} root0.vnTemplate - VN Template data
 * @param {string} root0.dataCy - Data-cy attribute
 * @param {boolean} root0.isSelected - Whether card is selected
 * @param {Function} root0.onCheck - Check handler
 * @param {Function} root0.onClick - Click handler
 * @param {object} ref - Forwarded ref
 * @returns {Component} VN Template card component
 */
export const VnTemplatesCard = forwardRef(
  ({ vnTemplate = {}, dataCy, isSelected, onCheck, onClick }, ref) => {
    const {
      ID,
      NAME,
      UNAME,
      GNAME,
      REGTIME,
      TEMPLATE: { VN_MAD } = {},
    } = vnTemplate
    const labelTags = getLabelTags(vnTemplate?.LABELS)

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
              title: (
                <>
                  {NAME} {getLockIcon(vnTemplate)}
                </>
              ),
            },
          ],
          [
            MetadataSlot,
            {
              labels: [
                [T.ID, String(ID)],
                [T.Owner, UNAME],
                [T.Group, GNAME],
              ].filter(([, value]) => value),
            },
          ],
          (VN_MAD || labelTags.length > 0) && [
            LabelSlot,
            {
              labels: [VN_MAD && [VN_MAD, 'default']].filter(Boolean),
              tags: labelTags,
              max: 3,
            },
          ],
          REGTIME && [
            TimeSlot,
            {
              time: REGTIME,
              label: T.Registered,
            },
          ],
        ].filter(Boolean)}
      />
    )
  }
)

VnTemplatesCard.propTypes = {
  vnTemplate: PropTypes.object,
  dataCy: PropTypes.string,
  isSelected: PropTypes.bool,
  onCheck: PropTypes.func,
  onClick: PropTypes.func,
}

VnTemplatesCard.displayName = 'VnTemplatesCard'
