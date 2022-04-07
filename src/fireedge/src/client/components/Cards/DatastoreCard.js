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
import { User, Group, Lock, Cloud, Server } from 'iconoir-react'

import {
  StatusCircle,
  StatusChip,
  LinearProgressWithLabel,
} from 'client/components/Status'

import { getState, getType, getCapacityInfo } from 'client/models/Datastore'
import { rowStyles } from 'client/components/Tables/styles'
import { Datastore } from 'client/constants'

const DatastoreCard = memo(
  /**
   * @param {object} props - Props
   * @param {Datastore} props.datastore - Datastore resource
   * @param {object} props.rootProps - Props to root component
   * @param {ReactElement} props.actions - Actions
   * @returns {ReactElement} - Card
   */
  ({ datastore, rootProps, actions }) => {
    const classes = rowStyles()

    const { ID, NAME, UNAME, GNAME, CLUSTERS, LOCK, PROVISION_ID } = datastore

    const type = getType(datastore)
    const { color: stateColor, name: stateName } = getState(datastore)
    const { percentOfUsed, percentLabel } = getCapacityInfo(datastore)
    const totalClusters = [CLUSTERS?.ID ?? []].flat().join(',')

    return (
      <div {...rootProps} data-cy={`datastore-${ID}`}>
        <div>
          <StatusCircle color={stateColor} tooltip={stateName} />
        </div>
        <div className={classes.main}>
          <div className={classes.title}>
            <Typography component="span">{NAME}</Typography>
            <span className={classes.labels}>
              {LOCK && <Lock />}
              <StatusChip text={type} />
            </span>
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
            {PROVISION_ID && (
              <span title={`Provision ID: #${PROVISION_ID}`}>
                <Cloud />
                <span>{` ${PROVISION_ID}`}</span>
              </span>
            )}
            <span title={`Cluster IDs: ${totalClusters}`}>
              <Server />
              <span>{` ${totalClusters}`}</span>
            </span>
          </div>
        </div>
        <div className={classes.secondary}>
          <LinearProgressWithLabel value={percentOfUsed} label={percentLabel} />
        </div>
        {actions && <div className={classes.actions}>{actions}</div>}
      </div>
    )
  }
)

DatastoreCard.propTypes = {
  datastore: PropTypes.object,
  rootProps: PropTypes.shape({
    className: PropTypes.string,
  }),
  actions: PropTypes.any,
}

DatastoreCard.displayName = 'DatastoreCard'

export default DatastoreCard
