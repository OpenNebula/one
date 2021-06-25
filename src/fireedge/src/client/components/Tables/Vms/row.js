import * as React from 'react'
import PropTypes from 'prop-types'

import { User, Group, Lock, HardDrive } from 'iconoir-react'
import { Typography } from '@material-ui/core'

import { StatusCircle } from 'client/components/Status'
import Multiple from 'client/components/Tables/Vms/multiple'
import { rowStyles } from 'client/components/Tables/styles'

import * as Helper from 'client/models/Helper'

const Row = ({ value, ...props }) => {
  const classes = rowStyles()
  const {
    ID, NAME, UNAME, GNAME, STATE,
    IPS, STIME, ETIME, HOSTNAME, LOCK
  } = value

  const time = Helper.timeFromMilliseconds(+ETIME || +STIME)
  const timeAgo = `${+ETIME ? 'done' : 'started'} ${time.toRelative()}`

  return (
    <div {...props}>
      <div>
        <StatusCircle color={STATE?.color} tooltip={STATE?.name} />
      </div>
      <div className={classes.main}>
        <Typography className={classes.title} component='span'>
          {NAME}
          {LOCK && <Lock size={20} />}
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
          <span title={`Hostname: ${HOSTNAME}`}>
            <HardDrive size={16} />
            <span>{` ${HOSTNAME}`}</span>
          </span>
        </div>
      </div>
      <div className={classes.secondary}>
        {!!IPS?.length && <Multiple tags={IPS.split(',')} />}
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
