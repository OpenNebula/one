import * as React from 'react'
import PropTypes from 'prop-types'

import { Tooltip, Typography } from '@material-ui/core'

const StatusCircle = ({ color, tooltip, size }) => (
  <Tooltip arrow placement='right-end'
    title={<Typography variant='subtitle2'>{tooltip}</Typography>}
  >
    <svg
      viewBox='0 0 100 100'
      version='1.1'
      width={size}
      height={size}
      aria-hidden='true'
      style={{
        color,
        fill: 'currentColor',
        verticalAlign: 'text-bottom'
      }}
    >
      <circle cx='50' cy='50' r='50' />
    </svg>
  </Tooltip>
)

StatusCircle.propTypes = {
  tooltip: PropTypes.string,
  color: PropTypes.string,
  size: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number
  ])
}

StatusCircle.defaultProps = {
  tooltip: undefined,
  color: undefined,
  size: 12
}

StatusCircle.displayName = 'StatusCircle'

export default StatusCircle
