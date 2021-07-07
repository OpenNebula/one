import * as React from 'react'
import PropTypes from 'prop-types'

import { Lock, User, Group, Cart } from 'iconoir-react'
import { Typography } from '@material-ui/core'

import { StatusCircle, StatusChip } from 'client/components/Status'
import { rowStyles } from 'client/components/Tables/styles'

import * as MarketplaceAppModel from 'client/models/MarketplaceApp'
import * as Helper from 'client/models/Helper'
import { prettyBytes } from 'client/utils'

const Row = ({ original, value, ...props }) => {
  const classes = rowStyles()
  const {
    ID, NAME, UNAME, GNAME, LOCK, TYPE,
    REGTIME, MARKETPLACE, ZONE_ID, SIZE
  } = value

  const { color: stateColor, name: stateName } = MarketplaceAppModel.getState(original)

  const time = Helper.timeFromMilliseconds(+REGTIME)
  const timeAgo = `registered ${time.toRelative()}`

  return (
    <div {...props}>
      <div>
        <StatusCircle color={stateColor} tooltip={stateName} />
      </div>
      <div className={classes.main}>
        <div className={classes.title}>
          <Typography className={classes.titleText} component='span'>
            {NAME}
          </Typography>
          {LOCK && <Lock size={20} />}
          <span className={classes.labels}>
            <StatusChip text={TYPE} />
          </span>
        </div>
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
          <StatusChip text={`Zone ${ZONE_ID}`} />
          <StatusChip text={prettyBytes(+SIZE, 'MB')} />
        </span>
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
