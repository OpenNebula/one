import * as React from 'react'
import PropTypes from 'prop-types'

import { ShieldCheck } from 'iconoir-react'
import { Typography } from '@material-ui/core'

import { StatusCircle } from 'client/components/Status'
import { rowStyles } from 'client/components/Tables/styles'

import * as ZoneModel from 'client/models/Zone'

const Row = ({ original, value, ...props }) => {
  const classes = rowStyles()
  const { ID, NAME, ENDPOINT } = value

  const { color: stateColor, name: stateName } = ZoneModel.getState(original)

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
        </div>
        <div className={classes.caption}>
          <span>
            {`#${ID}`}
          </span>
          <span title={`Endpoint: ${ENDPOINT}`}>
            <ShieldCheck size={16} />
            <span>{` ${ENDPOINT}`}</span>
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
