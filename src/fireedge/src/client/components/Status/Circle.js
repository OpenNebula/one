/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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
import { memo, forwardRef } from 'react'
import PropTypes from 'prop-types'

import { SvgIcon, Tooltip, Typography } from '@mui/material'

// ----------------------------------------
// Circle SVG
// ----------------------------------------

const Circle = forwardRef(({ size, color, ...props }, ref) => (
  <SvgIcon
    {...props}
    ref={ref}
    viewBox="0 0 100 100"
    sx={{
      color,
      width: size,
      height: size,
      fill: 'currentColor',
      verticalAlign: 'middle',
      pointerEvents: 'auto',
    }}
  >
    <circle cx="50" cy="50" r="50" />
  </SvgIcon>
))

Circle.propTypes = {
  color: PropTypes.string,
  size: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
}

Circle.displayName = 'Circle'

// ----------------------------------------
// Status Circle component
// ----------------------------------------

const StatusCircle = memo(
  ({ color, tooltip, size = 12 }) =>
    tooltip ? (
      <Tooltip
        arrow
        placement="right-end"
        title={<Typography variant="subtitle2">{tooltip}</Typography>}
      >
        <Circle color={color} size={size} />
      </Tooltip>
    ) : (
      <Circle color={color} size={size} />
    ),
  (prev, next) => prev.color === next.color && prev.tooltip === next.tooltip
)

StatusCircle.propTypes = { tooltip: PropTypes.string, ...Circle.propTypes }

StatusCircle.displayName = 'StatusCircle'

export default StatusCircle
