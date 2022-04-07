/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
import { memo, ReactElement } from 'react'
import PropTypes from 'prop-types'
import { Typography } from '@mui/material'
import { User, Group, Lock, Server, Cloud } from 'iconoir-react'

import { LinearProgressWithLabel } from 'client/components/Status'
import { getLeasesInfo, getTotalLeases } from 'client/models/VirtualNetwork'
import { rowStyles } from 'client/components/Tables/styles'

const NetworkCard = memo(
  /**
   * @param {object} props - Props
   * @param {object} props.network - Network resource
   * @param {object} props.rootProps - Props to root component
   * @param {ReactElement} props.actions - Actions
   * @returns {ReactElement} - Card
   */
  ({ network, rootProps, actions }) => {
    const classes = rowStyles()

    const { ID, NAME, UNAME, GNAME, LOCK, CLUSTERS, USED_LEASES, TEMPLATE } =
      network

    const totalLeases = getTotalLeases(network)
    const { percentOfUsed, percentLabel } = getLeasesInfo(network)
    const totalClusters = [CLUSTERS?.ID ?? []].flat().length || 0
    const provisionId = TEMPLATE?.PROVISION?.ID

    return (
      <div {...rootProps} data-cy={`network-${ID}`}>
        <div className={classes.main}>
          <div className={classes.title}>
            <Typography component="span">{NAME}</Typography>
            <span className={classes.labels}>{LOCK && <Lock />}</span>
          </div>
          <div className={classes.caption}>
            <span>{`#${ID}`}</span>
            <span title={`Owner: ${UNAME}`}>
              <User />
              <span>{` ${UNAME}`}</span>
            </span>
            <span title={`Group: ${GNAME}`}>
              <Group />
              <span>{` ${GNAME}`}</span>
            </span>
            <span title={`Total Clusters: ${totalClusters}`}>
              <Server />
              <span>{` ${totalClusters}`}</span>
            </span>
            {provisionId && (
              <span title={`Provision ID: #${provisionId}`}>
                <Cloud />
                <span>{` ${provisionId}`}</span>
              </span>
            )}
          </div>
        </div>
        <div className={classes.secondary}>
          <LinearProgressWithLabel
            title={`Used / Total Leases: ${USED_LEASES} / ${totalLeases}`}
            value={percentOfUsed}
            label={percentLabel}
          />
        </div>
        {actions && <div className={classes.actions}>{actions}</div>}
      </div>
    )
  }
)

NetworkCard.propTypes = {
  network: PropTypes.object,
  rootProps: PropTypes.shape({
    className: PropTypes.string,
  }),
  actions: PropTypes.any,
}

NetworkCard.displayName = 'NetworkCard'

export default NetworkCard
