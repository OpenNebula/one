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

import { T, UNITS } from '@ConstantsModule'
import { Component, forwardRef } from 'react'
import PropTypes from 'prop-types'
import {
  Card,
  IconSlot,
  LabelSlot,
  MetadataSlot,
  TimeSlot,
  TitleSlot,
} from '@ComponentsV2Module'
import { getLabelTags, getMarketplaceAppState } from '@ModelsModule'
import { getLockIcon, prettyBytes } from '@UtilsModule'

/**
 * MarketplaceAppsCard component displays a Marketplace App as a card.
 *
 * @param {object} root0 - Params
 * @param {object} root0.marketplaceApp - Marketplace App data
 * @param {boolean} root0.isSelected - Whether card is selected
 * @param {Function} root0.onCheck - Check handler
 * @param {Function} root0.onClick - Click handler
 * @param {object} ref - Forwarded ref
 * @returns {Component} MarketplaceAppsCard component
 */
export const MarketplaceAppsCard = forwardRef(
  ({ marketplaceApp = {}, isSelected, onCheck, onClick }, ref) => {
    const {
      ID,
      NAME,
      UNAME,
      GNAME,
      MARKETPLACE,
      SIZE,
      REGTIME,
      VERSION,
      TEMPLATE = {},
    } = marketplaceApp

    const { color: stateColor, name: stateName } =
      getMarketplaceAppState(marketplaceApp) ?? {}
    const labelTags = getLabelTags(marketplaceApp?.LABELS)

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
                  {NAME} {getLockIcon(marketplaceApp)}
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
                [T.ID, String(ID)],
                [T.Owner, UNAME],
                [T.Group, GNAME],
              ].filter(([, value]) => value),
            },
          ],
          [
            IconSlot,
            {
              size: prettyBytes(SIZE, UNITS.MB),
              marketplace: MARKETPLACE || '-',
            },
          ],
          (TEMPLATE?.HYPERVISOR ||
            TEMPLATE?.ARCHITECTURE ||
            VERSION ||
            labelTags.length > 0) && [
            LabelSlot,
            {
              labels: [
                TEMPLATE?.HYPERVISOR && [TEMPLATE.HYPERVISOR, 'miscellaneous'],
                TEMPLATE?.ARCHITECTURE && [
                  TEMPLATE.ARCHITECTURE,
                  'miscellaneous2',
                ],
                VERSION && [VERSION, 'default'],
              ].filter(Boolean),
              tags: labelTags,
              max: 2,
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

MarketplaceAppsCard.propTypes = {
  marketplaceApp: PropTypes.object,
  isSelected: PropTypes.bool,
  onCheck: PropTypes.func,
  onClick: PropTypes.func,
}

MarketplaceAppsCard.displayName = 'MarketplaceAppsCard'
