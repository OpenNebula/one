import * as React from 'react'
import PropTypes from 'prop-types'

import { Server, ModernTv } from 'iconoir-react'
import { Typography } from '@material-ui/core'

import { StatusCircle, LinearProgressWithLabel, StatusChip } from 'client/components/Status'
import { rowStyles } from 'client/components/Tables/styles'

import * as HostModel from 'client/models/Host'

const Row = ({ value, ...props }) => {
  const classes = rowStyles()
  const {
    ID, NAME, IM_MAD, VM_MAD, STATE,
    RUNNING_VMS, TOTAL_VMS, CLUSTER, TEMPLATE
  } = value

  const {
    percentCpuUsed,
    percentCpuLabel,
    percentMemUsed,
    percentMemLabel
  } = HostModel.getAllocatedInfo(value)

  const labels = [...new Set([IM_MAD, VM_MAD])]

  return (
    <div {...props}>
      <div>
        <StatusCircle color={STATE?.color} tooltip={STATE?.name} />
      </div>
      <div className={classes.main}>
        <Typography className={classes.title} component='span'>
          {TEMPLATE?.NAME ?? NAME}
          <span className={classes.labels}>
            {labels.map(label => (
              <StatusChip key={label} stateColor={'#c6c6c6'} text={label} />
            ))}
          </span>
        </Typography>
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
  value: PropTypes.object,
  isSelected: PropTypes.bool,
  handleClick: PropTypes.func
}

export default Row
