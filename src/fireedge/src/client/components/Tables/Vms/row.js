import * as React from 'react'
import PropTypes from 'prop-types'

import { User, Group, Lock, HardDrive } from 'iconoir-react'
import { Typography } from '@material-ui/core'

import { StatusCircle } from 'client/components/Status'
import Multiple from 'client/components/Tables/Vms/multiple'
import { rowStyles } from 'client/components/Tables/styles'

import * as VirtualMachineModel from 'client/models/VirtualMachine'
import * as Helper from 'client/models/Helper'

const Row = ({ original, value, ...props }) => {
  const classes = rowStyles()
  const { ID, NAME, UNAME, GNAME, IPS, STIME, ETIME, HOSTNAME = '--', LOCK } = value

  const time = Helper.timeFromMilliseconds(+ETIME || +STIME)
  const timeAgo = `${+ETIME ? 'done' : 'started'} ${time.toRelative()}`

  const { color: stateColor, name: stateName } = VirtualMachineModel.getState(original)

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
          <span className={classes.labels}>
            {LOCK && <Lock size={20} />}
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
          <span title={`Hostname: ${HOSTNAME}`}>
            <HardDrive size={16} />
            <span>{` ${HOSTNAME}`}</span>
          </span>
        </div>
      </div>
      {!!IPS?.length && (
        <div className={classes.secondary}>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'end',
            alignItems: 'center'
          }}>
            <Multiple tags={IPS.split(',')} />
          </div>
        </div>
      )}
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
