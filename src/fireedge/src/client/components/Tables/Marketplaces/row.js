import * as React from 'react'
import PropTypes from 'prop-types'

import { User, Group } from 'iconoir-react'
import { Typography } from '@material-ui/core'

import { StatusCircle, LinearProgressWithLabel, StatusChip } from 'client/components/Status'
import { rowStyles } from 'client/components/Tables/styles'

import * as MarketplaceModel from 'client/models/Datastore'

const Row = ({ value, ...props }) => {
  const classes = rowStyles()
  const { ID, NAME, UNAME, GNAME, MARKET_MAD, MARKETPLACEAPPS } = value

  const { percentOfUsed, percentLabel } = MarketplaceModel.getCapacityInfo(value)

  const state = MarketplaceModel.getState(value)
  const apps = [MARKETPLACEAPPS?.ID ?? []].flat().length || 0

  return (
    <div {...props}>
      <div>
        <StatusCircle color={state?.color} tooltip={state?.name} />
      </div>
      <div className={classes.main}>
        <Typography className={classes.title} component='span'>
          {NAME}
          <span className={classes.labels}>
            <StatusChip stateColor={'#c6c6c6'} text={MARKET_MAD} />
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
          <span>
            <Group size={16} />
            <span>{` ${apps}`}</span>
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
