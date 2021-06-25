import * as React from 'react'
import PropTypes from 'prop-types'

import { Lock, User, Group, Folder, ModernTv } from 'iconoir-react'
import { Typography } from '@material-ui/core'

import { StatusCircle, StatusChip } from 'client/components/Status'
import { rowStyles } from 'client/components/Tables/styles'

import * as Helper from 'client/models/Helper'

const Row = ({ value, ...props }) => {
  const classes = rowStyles()
  const {
    ID, NAME, UNAME, GNAME, REGTIME,
    STATE, TYPE, DISK_TYPE, PERSISTENT,
    LOCK, DATASTORE, VMS, RUNNING_VMS
  } = value

  const usedByVms = [VMS?.ID ?? []].flat().length || 0

  const labels = [...new Set([
    PERSISTENT && 'PERSISTENT', TYPE, DISK_TYPE])].filter(Boolean)

  const time = Helper.timeFromMilliseconds(+REGTIME)
  const timeAgo = `registered ${time.toRelative()}`

  return (
    <div {...props}>
      <div>
        <StatusCircle color={STATE?.color} tooltip={STATE?.name} />
      </div>
      <div className={classes.main}>
        <Typography className={classes.title} component='span'>
          {NAME}
          {LOCK && <Lock size={20} />}
          <span className={classes.labels}>
            {labels.map(label => (
              <StatusChip key={label} stateColor={'#c6c6c6'} text={label} />
            ))}
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
          <span title={`Datastore: ${DATASTORE}`}>
            <Folder size={16} />
            <span>{` ${DATASTORE}`}</span>
          </span>
          <span title={`Running / Used VMs: ${RUNNING_VMS} / ${usedByVms}`}>
            <ModernTv size={16} />
            <span>{` ${RUNNING_VMS} / ${usedByVms}`}</span>
          </span>
        </div>
      </div>
      <div className={classes.secondary}></div>
    </div>
  )
}

Row.propTypes = {
  value: PropTypes.object,
  isSelected: PropTypes.bool,
  handleClick: PropTypes.func
}

export default Row
