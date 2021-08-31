/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
/* eslint-disable jsdoc/require-jsdoc */
import PropTypes from 'prop-types'

import { User, Group, Lock, Cloud, Server } from 'iconoir-react'
import { Typography } from '@material-ui/core'

import { StatusCircle, LinearProgressWithLabel, StatusChip } from 'client/components/Status'
import { rowStyles } from 'client/components/Tables/styles'

import * as DatastoreModel from 'client/models/Datastore'

const Row = ({ original, value, ...props }) => {
  const classes = rowStyles()
  const { ID, NAME, UNAME, GNAME, TYPE, CLUSTERS, LOCK, PROVISION_ID } = value

  const { percentOfUsed, percentLabel } = DatastoreModel.getCapacityInfo(value)

  const { color: stateColor, name: stateName } = DatastoreModel.getState(original)

  return (
    <div {...props}>
      <div>
        <StatusCircle color={stateColor} tooltip={stateName} />
      </div>
      <div className={classes.main}>
        <div className={classes.title}>
          <Typography component='span'>
            {NAME}
          </Typography>
          <span className={classes.labels}>
            {LOCK && <Lock size={20} />}
            <StatusChip text={TYPE?.name} />
          </span>
        </div>
        <div className={classes.caption}>
          <span>{`#${ID}`}</span>
          <span title={`Owner: ${UNAME}`}>
            <User size={16} />
            <span>{` ${UNAME}`}</span>
          </span>
          <span title={`Group: ${GNAME}`}>
            <Group size={16} />
            <span>{` ${GNAME}`}</span>
          </span>
          {PROVISION_ID && <span title={`Provision ID: #${PROVISION_ID}`}>
            <Cloud size={16} />
            <span>{` ${PROVISION_ID}`}</span>
          </span>}
          <span title={`Cluster IDs: ${CLUSTERS.join(',')}`}>
            <Server size={16} />
            <span>{` ${CLUSTERS.join(',')}`}</span>
          </span>
        </div>
      </div>
      <div className={classes.secondary}>
        <LinearProgressWithLabel value={percentOfUsed} label={percentLabel} />
      </div>
    </div>
  )
}

Row.propTypes = {
  original: PropTypes.object,
  value: PropTypes.object,
  isSelected: PropTypes.bool,
  handleClick: PropTypes.func
}

export default Row
