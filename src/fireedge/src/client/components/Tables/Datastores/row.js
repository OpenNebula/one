import * as React from 'react'
import PropTypes from 'prop-types'

import { User, Group, Lock, Cloud, Server } from 'iconoir-react'
import { Typography } from '@material-ui/core'

import { StatusCircle, LinearProgressWithLabel, StatusChip } from 'client/components/Status'
import { rowStyles } from 'client/components/Tables/styles'

import * as DatastoreModel from 'client/models/Datastore'

const Row = ({ value, ...props }) => {
  const classes = rowStyles()
  const { ID, NAME, UNAME, GNAME, CLUSTERS, LOCK, TEMPLATE } = value
  const { PROVISION } = TEMPLATE

  const state = DatastoreModel.getState(value)
  const type = DatastoreModel.getType(value)

  const clusters = [CLUSTERS?.ID ?? []].flat()
  const { percentOfUsed, percentLabel } = DatastoreModel.getCapacityInfo(value)

  return (
    <div {...props}>
      <div>
        <StatusCircle color={state?.color} tooltip={state?.name} />
      </div>
      <div className={classes.main}>
        <Typography className={classes.title} component='span'>
          {NAME}
          <span className={classes.labels}>
            {LOCK && <Lock size={20} />}
            <StatusChip stateColor={'#c6c6c6'} text={type?.name} />
          </span>
        </Typography>
        <div className={classes.caption}>
          <span>{`#${ID}`}</span>
          <span>
            <User size={16} />
            <span>{` ${UNAME}`}</span>
          </span>
          <span>
            <Group size={16} />
            <span>{` ${GNAME}`}</span>
          </span>
          {PROVISION?.ID && <span>
            <Cloud size={16} />
            <span>{` ${PROVISION.ID}`}</span>
          </span>}
          <span>
            <Server size={16} />
            <span>{` ${clusters.join(',')}`}</span>
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
