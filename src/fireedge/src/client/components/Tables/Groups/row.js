import * as React from 'react'
import PropTypes from 'prop-types'

import { Group } from 'iconoir-react'
import { Typography } from '@material-ui/core'

import { rowStyles } from 'client/components/Tables/styles'

const Row = ({ original, value, ...props }) => {
  const classes = rowStyles()
  const { ID, NAME, TOTAL_USERS } = value

  return (
    <div {...props}>
      <div className={classes.main}>
        <div className={classes.title}>
          <Typography component='span'>
            {NAME}
          </Typography>
        </div>
        <div className={classes.caption}>
          <span>
            {`#${ID}`}
          </span>
          <span title={`Total Users: ${TOTAL_USERS}`}>
            <Group size={16} />
            <span>{` ${TOTAL_USERS}`}</span>
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
