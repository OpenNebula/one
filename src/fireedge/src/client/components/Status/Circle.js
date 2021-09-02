/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
 *                                                                           *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may   *
 * not use this file except in compliance with the License. You may obtain   *
 * a copy of the License at                                                  *
 *                                                                           *
 * http://www.apache.org/licenses/LICENSE-2.0                                *
 *                                                                           *
 * Unless required by applicable law or agreed to in writing, software       *
 * distributed under the License is distributed on an "AS IS" BASIS,         *
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  *
 * See the License for the specific language governing permissions and       *
 * limitations under the License.                                            *
 * ------------------------------------------------------------------------- */
/* eslint-disable jsdoc/require-jsdoc */
import { memo } from 'react'
import PropTypes from 'prop-types'
import { makeStyles, Tooltip, Typography } from '@material-ui/core'

const useStyles = makeStyles({
  circle: ({ color }) => ({
    color,
    fill: 'currentColor',
    verticalAlign: 'text-bottom',
    pointerEvents: 'auto'
  })
})

const StatusCircle = memo(({ color, tooltip, size }) => {
  const classes = useStyles({ color })

  return (
    <Tooltip
      arrow
      placement='right-end'
      title={<Typography variant='subtitle2'>{tooltip}</Typography>}
    >
      <svg
        viewBox='0 0 100 100'
        version='1.1'
        width={size}
        height={size}
        aria-hidden='true'
        className={classes.circle}
      >
        <circle cx='50' cy='50' r='50' />
      </svg>
    </Tooltip>
  )
}, (prev, next) => prev.color === next.color && prev.tooltip === next.tooltip)

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
