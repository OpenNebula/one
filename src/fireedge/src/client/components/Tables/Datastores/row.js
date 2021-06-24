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

  const clusters = [CLUSTERS?.ID ?? []].flat().join(',')
  const { percentOfUsed, percentLabel } = DatastoreModel.getCapacityInfo(value)
  const provisionId = PROVISION?.ID

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
          <span title={`Owner: ${UNAME}`}>
            <User size={16} />
            <span>{` ${UNAME}`}</span>
          </span>
          <span title={`Group: ${GNAME}`}>
            <Group size={16} />
            <span>{` ${GNAME}`}</span>
          </span>
          {provisionId && <span title={`Provision ID: #${provisionId}`}>
            <Cloud size={16} />
            <span>{` ${provisionId}`}</span>
          </span>}
          <span title={`Cluster IDs: ${clusters}`}>
            <Server size={16} />
            <span>{` ${clusters}`}</span>
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
