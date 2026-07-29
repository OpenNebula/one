/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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

import { Box } from '@mui/material'
import PropTypes from 'prop-types'

/**
 * Displays a label color indicator.
 *
 * @param {object} root0 - Component props
 * @param {string} root0.color - Dot color
 * @param {number} root0.size - Dot size in pixels
 * @returns {object} Color indicator
 */
export const ColorDot = ({ color, size = 18 }) => (
  <Box
    component="span"
    sx={{
      bgcolor: color,
      borderRadius: '50%',
      display: 'inline-block',
      flex: `0 0 ${size}px`,
      height: size,
      width: size,
    }}
  />
)

ColorDot.propTypes = {
  color: PropTypes.string,
  size: PropTypes.number,
}
