import * as React from 'react'
import PropTypes from 'prop-types'

import { User, Group, Lock, Cloud, Server } from 'iconoir-react'
import { Typography } from '@material-ui/core'

import { StatusCircle, LinearProgressWithLabel, StatusChip } from 'client/components/Status'
import { rowStyles } from 'client/components/Tables/styles'

import * as DatastoreModel from 'client/models/Datastore'

const Row = ({ value, ...props }) => {
  const classes = rowStyles()
  const { ID, NAME, UNAME, GNAME, STATE, TYPE, CLUSTERS, LOCK, PROVISION_ID } = value

  const { percentOfUsed, percentLabel } = DatastoreModel.getCapacityInfo(value)

  return (
    <div {...props}>
      <div>
        <StatusCircle color={STATE?.color} tooltip={STATE?.name} />
      </div>
      <div className={classes.main}>
        <Typography className={classes.title} component='span'>
          {NAME}
          <span className={classes.labels}>
            {LOCK && <Lock size={20} />}
            <StatusChip stateColor={'#c6c6c6'} text={TYPE?.name} />
          </span>
        </Typography>
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
  value: PropTypes.object,
  isSelected: PropTypes.bool,
  handleClick: PropTypes.func
}

export default Row
