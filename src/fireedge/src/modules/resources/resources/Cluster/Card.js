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
import { Card, LabelSlot, MetadataSlot, TitleSlot } from '@ComponentsV2Module'
import { Component, forwardRef } from 'react'
import { getTotalOfResources } from '@UtilsModule'
import { getLabelTags } from '@ModelsModule'
import PropTypes from 'prop-types'

/**
 * ClusterCard component displays a Cluster as a card.
 *
 * @param {object} root0 - Params
 * @param {object} root0.cluster - Cluster data
 * @param {string} root0.dataCy - Data-cy attribute
 * @param {boolean} root0.isSelected - Whether card is selected
 * @param {Function} root0.onCheck - Check handler
 * @param {Function} root0.onClick - Click handler
 * @param {object} ref - Forwarded ref
 * @returns {Component} ClusterCard component
 */
export const ClusterCard = forwardRef(
  ({ cluster = {}, dataCy, isSelected, onCheck, onClick }, ref) => {
    const { ID, NAME, HOSTS, VNETS, DATASTORES, TEMPLATE } = cluster
    const id = String(ID)
    const template =
      typeof TEMPLATE === 'object' && !Array.isArray(TEMPLATE) ? TEMPLATE : {}
    const driver = template?.ONEFORM?.DRIVER
    const labelTags = getLabelTags(cluster?.LABELS)

    return (
      <Card
        ref={ref}
        dataCy={dataCy}
        onCheck={onCheck}
        onClick={onClick}
        isSelected={isSelected}
        slots={[
          [TitleSlot, { title: NAME }],
          [
            MetadataSlot,
            {
              labels: [
                [T.ID, id],
                [T.Hosts, String(getTotalOfResources(HOSTS))],
                [T.Datastores, String(getTotalOfResources(DATASTORES))],
                [T.VirtualNetworks, String(getTotalOfResources(VNETS))],
              ].filter(Boolean),
            },
          ],
          (driver || labelTags.length > 0) && [
            LabelSlot,
            {
              labels: [driver && [driver, 'default']].filter(Boolean),
              tags: labelTags,
              max: 3,
            },
          ],
        ].filter(Boolean)}
      />
    )
  }
)

ClusterCard.propTypes = {
  cluster: PropTypes.shape({
    ID: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    NAME: PropTypes.string,
    HOSTS: PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.object),
      PropTypes.object,
      PropTypes.string,
    ]),
    VNETS: PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.object),
      PropTypes.object,
      PropTypes.string,
    ]),
    DATASTORES: PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.object),
      PropTypes.object,
      PropTypes.string,
    ]),
    TEMPLATE: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  }),
  dataCy: PropTypes.string,
  isSelected: PropTypes.bool,
  onCheck: PropTypes.func,
  onClick: PropTypes.func,
}

ClusterCard.displayName = 'ClusterCard'
