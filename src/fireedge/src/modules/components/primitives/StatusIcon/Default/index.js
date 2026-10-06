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

import { Component, forwardRef } from 'react'
import PropTypes from 'prop-types'
import { Box } from '@mui/material'
import { InfoEmpty, Check, WarningTriangle, WarningCircle } from 'iconoir-react'
import { getStyles } from '@modules/components/primitives/StatusIcon/Default/styles'

const STATUS_ICONS = {
  information: InfoEmpty,
  success: Check,
  warning: WarningTriangle,
  error: WarningCircle,
}

/**
 * Status icon with the design system's status colors.
 *
 * @param {object} root0 - Props
 * @param {string} root0.status - Information, success, warning or error
 * @param {number} root0.size - Optional icon size in pixels
 * @param {object|Array|Function} root0.sx - Additional styles
 * @returns {Component} Status icon
 */
export const StatusIcon = forwardRef(
  ({ status = 'information', size, sx, ...opts }, ref) => {
    const Icon = STATUS_ICONS[status] ?? InfoEmpty

    return (
      <Box
        component={Icon}
        ref={ref}
        sx={[
          (theme) => getStyles({ theme, status, size }),
          ...(Array.isArray(sx) ? sx : [sx]),
        ].filter(Boolean)}
        {...opts}
      />
    )
  }
)

StatusIcon.propTypes = {
  status: PropTypes.oneOf(['information', 'success', 'warning', 'error']),
  size: PropTypes.number,
  sx: PropTypes.oneOfType([PropTypes.object, PropTypes.array, PropTypes.func]),
}

StatusIcon.displayName = 'StatusIcon'
