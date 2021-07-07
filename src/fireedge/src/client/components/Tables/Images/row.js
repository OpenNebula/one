import * as React from 'react'
import PropTypes from 'prop-types'

import { Lock, User, Group, Folder, ModernTv } from 'iconoir-react'
import { Typography } from '@material-ui/core'

import { StatusCircle, StatusChip } from 'client/components/Status'
import { rowStyles } from 'client/components/Tables/styles'

import * as ImageModel from 'client/models/Image'
import * as Helper from 'client/models/Helper'

const Row = ({ original, value, ...props }) => {
  const classes = rowStyles()
  const {
    ID, NAME, UNAME, GNAME, REGTIME, TYPE,
    DISK_TYPE, PERSISTENT, LOCK, DATASTORE,
    TOTAL_VMS, RUNNING_VMS
  } = value

  const labels = [...new Set([
    PERSISTENT && 'PERSISTENT', TYPE, DISK_TYPE])].filter(Boolean)

  const { color: stateColor, name: stateName } = ImageModel.getState(original)

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
            {labels.map(label => (
              <StatusChip key={label} text={label} />
            ))}
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
          <span title={`Datastore: ${DATASTORE}`}>
            <Folder size={16} />
            <span>{` ${DATASTORE}`}</span>
          </span>
          <span title={`Running / Used VMs: ${RUNNING_VMS} / ${TOTAL_VMS}`}>
            <ModernTv size={16} />
            <span>{` ${RUNNING_VMS} / ${TOTAL_VMS}`}</span>
          </span>
        </div>
      </div>
      <div className={classes.secondary}></div>
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
