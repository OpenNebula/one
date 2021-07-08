import * as React from 'react'
import PropTypes from 'prop-types'

import { Group, Lock, LockKey } from 'iconoir-react'
import { Typography } from '@material-ui/core'

import { rowStyles } from 'client/components/Tables/styles'

const Row = ({ original, value, ...props }) => {
  const classes = rowStyles()
  const { ID, NAME, GNAME, ENABLED, AUTH_DRIVER } = value

  return (
    <div {...props}>
      <div className={classes.main}>
        <div className={classes.title}>
          <Typography component='span'>
            {NAME}
          </Typography>
          <span className={classes.labels}>
            {!+ENABLED && <Lock size={20} />}
          </span>
        </div>
        <div className={classes.caption}>
          <span>
            {`#${ID}`}
          </span>
          <span title={`Group: ${GNAME}`}>
            <Group size={16} />
            <span>{` ${GNAME}`}</span>
          </span>
          <span title={`Auth Driver: ${AUTH_DRIVER}`}>
            <LockKey size={16} />
            <span>{` ${AUTH_DRIVER}`}</span>
          </span>
        </div>
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
