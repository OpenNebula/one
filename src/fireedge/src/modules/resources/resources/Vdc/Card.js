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
import { Db, ModernTv, Network } from 'iconoir-react'
import {
  getLabelTags,
  getVdcClustersCount,
  getVdcDatastoresCount,
  getVdcGroupsCount,
  getVdcHostsCount,
  getVdcVnetsCount,
} from '@ModelsModule'

/**
 * Displays a VDC card.
 *
 * @param {object} root0 - Params
 * @param {object} root0.vdc - VDC data
 * @param {boolean} root0.isSelected - Whether card is selected
 * @param {Function} root0.onCheck - Check handler
 * @param {Function} root0.onClick - Click handler
 * @param {object} ref - Forwarded ref
 * @returns {Component} VDC card
 */
export const VdcCard = forwardRef(
  ({ vdc = {}, dataCy, isSelected, onCheck, onClick }, ref) => {
    const labelTags = getLabelTags(vdc?.LABELS)

    return (
      <Card
        ref={ref}
        dataCy={dataCy}
        onCheck={onCheck}
        onClick={onClick}
        isSelected={isSelected}
        slots={[
          [TitleSlot, { title: vdc?.NAME }],
          [
            MetadataSlot,
            {
              labels: [
                [T.ID, String(vdc?.ID ?? '')],
                [T.Groups, String(getVdcGroupsCount(vdc))],
                [T.Clusters, String(getVdcClustersCount(vdc))],
              ].filter(([, value]) => value),
            },
          ],
          [
            IconSlot,
            {
              items: [
                {
                  Icon: ModernTv,
                  label: T.Hosts,
                  value: getVdcHostsCount(vdc),
                },
                {
                  Icon: Db,
                  label: T.Datastores,
                  value: getVdcDatastoresCount(vdc),
                },
                {
                  Icon: Network,
                  label: T.Networks,
                  value: getVdcVnetsCount(vdc),
                },
              ],
            },
          ],
          labelTags.length > 0 && [LabelSlot, { tags: labelTags, max: 3 }],
        ].filter(Boolean)}
      />
    )
  }
)

VdcCard.propTypes = {
  vdc: PropTypes.object,
  dataCy: PropTypes.string,
  isSelected: PropTypes.bool,
  onCheck: PropTypes.func,
  onClick: PropTypes.func,
}

VdcCard.displayName = 'VdcCard'
