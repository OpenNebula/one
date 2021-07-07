import * as React from 'react'
import PropTypes from 'prop-types'

import { Server, ModernTv } from 'iconoir-react'
import { Typography } from '@material-ui/core'

import { StatusCircle, LinearProgressWithLabel, StatusChip } from 'client/components/Status'
import { rowStyles } from 'client/components/Tables/styles'

import * as HostModel from 'client/models/Host'

const Row = ({ original, value, ...props }) => {
  const classes = rowStyles()
  const {
    ID, NAME, IM_MAD, VM_MAD, RUNNING_VMS,
    TOTAL_VMS, CLUSTER, TEMPLATE
  } = value

  const {
    percentCpuUsed,
    percentCpuLabel,
    percentMemUsed,
    percentMemLabel
  } = HostModel.getAllocatedInfo(value)

  const { color: stateColor, name: stateName } = HostModel.getState(original)

  const labels = [...new Set([IM_MAD, VM_MAD])]

  return (
    <div {...props}>
      <div>
        <StatusCircle color={stateColor} tooltip={stateName} />
      </div>
      <div className={classes.main}>
        <div className={classes.title}>
          <Typography className={classes.titleText} noWrap component='span'>
            {TEMPLATE?.NAME ?? NAME}
          </Typography>
          <span className={classes.labels}>
            {labels.map(label => (
              <StatusChip key={label} text={label} />
            ))}
          </span>
        </div>
        <div className={classes.caption}>
          <span>{`#${ID}`}</span>
          <span title={`Cluster: ${CLUSTER}`}>
            <Server size={16} />
            <span>{` ${CLUSTER}`}</span>
          </span>
          <span title={`Running VMs: ${RUNNING_VMS} / ${TOTAL_VMS}`}>
            <ModernTv size={16} />
            <span>{` ${RUNNING_VMS} / ${TOTAL_VMS}`}</span>
          </span>
        </div>
      </div>
      <div className={classes.secondary}>
        <LinearProgressWithLabel value={percentCpuUsed} label={percentCpuLabel} />
        <LinearProgressWithLabel value={percentMemUsed} label={percentMemLabel} />
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
