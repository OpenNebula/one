import * as React from 'react'
import PropTypes from 'prop-types'

import { User, Group, Lock, Server, Cloud } from 'iconoir-react'
import { Typography } from '@material-ui/core'

import { LinearProgressWithLabel } from 'client/components/Status'
import { rowStyles } from 'client/components/Tables/styles'

import * as VirtualNetworkModel from 'client/models/VirtualNetwork'

const Row = ({ original, value, ...props }) => {
  const classes = rowStyles()
  const {
    ID, NAME, UNAME, GNAME, LOCK, CLUSTERS,
    USED_LEASES, TOTAL_LEASES, PROVISION_ID
  } = value

  const { percentOfUsed, percentLabel } = VirtualNetworkModel.getLeasesInfo(original)

  return (
    <div {...props}>
      <div className={classes.main}>
        <div className={classes.title}>
          <Typography component='span'>
            {NAME}
          </Typography>
          <span className={classes.labels}>
            {LOCK && <Lock size={20} />}
          </span>
        </div>
        <div className={classes.caption}>
          <span>
            {`#${ID}`}
          </span>
          <span title={`Owner: ${UNAME}`}>
            <User size={16} />
            <span>{` ${UNAME}`}</span>
          </span>
          <span title={`Group: ${GNAME}`}>
            <Group size={16} />
            <span>{` ${GNAME}`}</span>
          </span>
          <span title={`Total Clusters: ${CLUSTERS}`}>
            <Server size={16} />
            <span>{` ${CLUSTERS}`}</span>
          </span>
          {PROVISION_ID && <span title={`Provision ID: #${PROVISION_ID}`}>
            <Cloud size={16} />
            <span>{` ${PROVISION_ID}`}</span>
          </span>}
        </div>
      </div>
      <div className={classes.secondary}>
        <LinearProgressWithLabel
          title={`Used / Total Leases: ${USED_LEASES} / ${TOTAL_LEASES}`}
          value={percentOfUsed}
          label={percentLabel}
        />
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
