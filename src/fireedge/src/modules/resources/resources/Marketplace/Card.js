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

import { MARKET_THRESHOLD, T } from '@ConstantsModule'
import { Component, forwardRef } from 'react'
import PropTypes from 'prop-types'
import {
  Card,
  LabelSlot,
  MetadataSlot,
  ProgressBarSlot,
  TitleSlot,
} from '@ComponentsV2Module'
import {
  getLabelSlotLabels,
  getMarketplaceCapacityInfo,
  getMarketplaceState,
} from '@ModelsModule'

/**
 * MarketplaceCard component displays a Marketplace as a card.
 *
 * @param {object} root0 - Params
 * @param {object} root0.marketplace - Marketplace data
 * @param {string} root0.dataCy - Cypress selector
 * @param {boolean} root0.isSelected - Whether card is selected
 * @param {Function} root0.onCheck - Check handler
 * @param {Function} root0.onClick - Click handler
 * @param {object} ref - Forwarded ref
 * @returns {Component} MarketplaceCard component
 */
export const MarketplaceCard = forwardRef(
  ({ marketplace = {}, dataCy, isSelected, onCheck, onClick }, ref) => {
    const { ID, NAME, UNAME, GNAME, MARKET_MAD, MARKETPLACEAPPS, ZONE_ID } =
      marketplace

    const id = String(ID)
    const { color: stateColor, name: stateName } =
      getMarketplaceState(marketplace) ?? {}
    const apps = [MARKETPLACEAPPS?.ID ?? []].flat().length || 0
    const { percentOfUsed, percentLabel } =
      getMarketplaceCapacityInfo(marketplace)
    const labelSlotLabels = getLabelSlotLabels(marketplace?.LABELS)

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
              title: NAME,
              status: stateColor,
              statusName: stateName,
            },
          ],
          [
            MetadataSlot,
            {
              labels: [
                [T.ID, id],
                [T.Owner, UNAME],
                [T.Group, GNAME],
                [T.Zone, String(ZONE_ID)],
                [T.Apps, String(apps)],
              ].filter(([, value]) => value),
            },
          ],
          [
            ProgressBarSlot,
            {
              bars: [
                {
                  label: `${T.Capacity} ${percentLabel}`,
                  value: percentOfUsed,
                  isLabelVisible: true,
                  thresholds: [
                    MARKET_THRESHOLD.CAPACITY.low,
                    MARKET_THRESHOLD.CAPACITY.high,
                  ],
                },
              ],
            },
          ],
          (MARKET_MAD || labelSlotLabels.length > 0) && [
            LabelSlot,
            {
              labels: [
                MARKET_MAD && [MARKET_MAD, 'default'],
                ...labelSlotLabels,
              ].filter(Boolean),
            },
          ],
        ]}
      />
    )
  }
)

MarketplaceCard.propTypes = {
  marketplace: PropTypes.object,
  dataCy: PropTypes.string,
  isSelected: PropTypes.bool,
  onCheck: PropTypes.func,
  onClick: PropTypes.func,
}

MarketplaceCard.displayName = 'MarketplaceCard'
