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

import PropTypes from 'prop-types'
import { Component, forwardRef } from 'react'
import {
  Card,
  IconSlot,
  LabelSlot,
  MetadataSlot,
  TitleSlot,
} from '@ComponentsV2Module'
import { T } from '@ConstantsModule'
import { getLockIcon } from '@UtilsModule'
import { getLabelTags, getSecurityGroupResourceCount } from '@ModelsModule'
import { Hexagon, PcCheck, PcNoEntry, PcWarning } from 'iconoir-react'

/**
 * SecurityGroupCard component displays a Security Group as a card.
 *
 * @param {object} root0 - Params
 * @param {object} root0.securityGroup - Security Group data
 * @param {string} root0.dataCy - Data-cy attribute
 * @param {boolean} root0.isSelected - Whether card is selected
 * @param {Function} root0.onCheck - Check handler
 * @param {Function} root0.onClick - Click handler
 * @param {object} ref - Forwarded ref
 * @returns {Component} SecurityGroupCard component
 */
export const SecurityGroupCard = forwardRef(
  ({ securityGroup = {}, dataCy, isSelected, onCheck, onClick }, ref) => {
    const {
      ID,
      NAME,
      UNAME,
      GNAME,
      TEMPLATE,
      UPDATED_VMS,
      OUTDATED_VMS,
      ERROR_VMS,
    } = securityGroup

    const id = String(ID)
    const totalRules = [].concat(TEMPLATE?.RULE ?? []).filter(Boolean).length
    const labelTags = getLabelTags(securityGroup?.LABELS)

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
                  {NAME} {getLockIcon(securityGroup)}
                </>
              ),
            },
          ],
          [
            MetadataSlot,
            {
              labels: [
                [T.ID, id],
                [T.Owner, UNAME],
                [T.Group, GNAME],
              ].filter(([, value]) => value),
            },
          ],
          [
            IconSlot,
            {
              items: [
                { Icon: Hexagon, label: T.Rules, value: totalRules },
                {
                  Icon: PcCheck,
                  label: T.UpdatedVms,
                  value: getSecurityGroupResourceCount(UPDATED_VMS),
                },
                {
                  Icon: PcNoEntry,
                  label: T.OutdatedVms,
                  value: getSecurityGroupResourceCount(OUTDATED_VMS),
                },
                {
                  Icon: PcWarning,
                  label: T.ErrorVms,
                  value: getSecurityGroupResourceCount(ERROR_VMS),
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

SecurityGroupCard.propTypes = {
  securityGroup: PropTypes.object,
  dataCy: PropTypes.string,
  isSelected: PropTypes.bool,
  onCheck: PropTypes.func,
  onClick: PropTypes.func,
}

SecurityGroupCard.displayName = 'SecurityGroupCard'
