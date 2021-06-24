import * as React from 'react'
import PropTypes from 'prop-types'

import { Lock, User, Group, Cart } from 'iconoir-react'
import { Typography } from '@material-ui/core'

import { StatusCircle, StatusChip } from 'client/components/Status'
import { rowStyles } from 'client/components/Tables/styles'

import * as MarketplaceAppModel from 'client/models/MarketplaceApp'
import * as Helper from 'client/models/Helper'
import { prettyBytes } from 'client/utils'

const Row = ({ value, ...props }) => {
  const classes = rowStyles()
  const { ID, NAME, UNAME, GNAME, LOCK, REGTIME, MARKETPLACE, ZONE_ID, SIZE } = value

  const type = MarketplaceAppModel.getType(value)
  const state = MarketplaceAppModel.getState(value)

  const time = Helper.timeFromMilliseconds(+REGTIME)
  const timeAgo = `registered ${time.toRelative()}`

  return (
    <div {...props}>
      <div>
        <StatusCircle color={state?.color} tooltip={state?.name} />
      </div>
      <div className={classes.main}>
        <Typography className={classes.title} component='span'>
          {NAME}
          {LOCK && <Lock size={20} />}
          <span className={classes.labels}>
            <StatusChip stateColor={'#c6c6c6'} text={type} />
          </span>
        </Typography>
        <div className={classes.caption}>
          <span title={time.toFormat('ff')}>
            {`#${ID} ${timeAgo}`}
          </span>
          <span title={`Owner: ${UNAME}`}>
            <User size={16} />
            <span>{` ${UNAME}`}</span>
          </span>
          <span title={`Group: ${GNAME}`}>
            <Group size={16} />
            <span>{` ${GNAME}`}</span>
          </span>
          <span title={`Marketplace: ${MARKETPLACE}`}>
            <Cart size={16} />
            <span>{` ${MARKETPLACE}`}</span>
          </span>
        </div>
      </div>
      <div className={classes.secondary}>
        <span className={classes.labels}>
          <StatusChip stateColor={'#c6c6c6'} text={`Zone ${ZONE_ID}`} />
          <StatusChip stateColor={'#c6c6c6'} text={prettyBytes(+SIZE, 'MB')} />
        </span>
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
