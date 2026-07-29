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
import { Box, Typography, IconButton } from '@mui/material'
import {
  InfoEmpty,
  Check,
  WarningTriangle,
  WarningCircle,
  Cancel,
} from 'iconoir-react'
import { getStyles } from '@modules/componentsv2/primitives/AlertNotification/Default/styles'
import { useTranslation } from '@ProvidersModule'

/**
 * Get status icon based on the status type.
 *
 * @param {string} status - Alert status
 * @returns {Component} - Icon component for the status
 */
const getStatusIcon = (status) => {
  const iconMap = {
    information: InfoEmpty,
    success: Check,
    warning: WarningTriangle,
    error: WarningCircle,
  }

  return iconMap?.[status] ?? InfoEmpty
}

/**
 * AlertNotification component displays informational alerts with different
 * types (primary, secondary, inline) and statuses (information, success, warning, error)
 *
 * @param {object} root0 - Params
 * @param {string} root0.type - Alert type: 'primary' | 'secondary' | 'inline'
 * @param {string} root0.status - Alert status: 'information' | 'success' | 'warning' | 'error'
 * @param {string} root0.title - Alert title text
 * @param {string} root0.description - Alert description text
 * @param {boolean} root0.isDismissible - Show close button (not shown for inline type)
 * @param {Function} root0.onDismiss - Callback when close button is clicked
 * @returns {Component} - AlertNotification component
 */
export const AlertNotification = forwardRef(
  (
    {
      type,
      status,
      title,
      description,
      isDismissible = true,
      onDismiss = () => {},
      ...opts
    },
    ref
  ) => {
    const { translate } = useTranslation()
    const StatusIcon = getStatusIcon(status)
    const showStatusIcon = type !== 'inline'
    const showCloseButton = isDismissible && type !== 'inline'

    return (
      <Box
        ref={ref}
        sx={(theme) => getStyles({ theme, type, status })}
        role="alert"
        {...opts}
      >
        <Box className="alert-content">
          {showStatusIcon && <StatusIcon className="status-icon" />}
          <Box className="text-content">
            {title && (
              <Typography className="alert-title">
                {translate(title)}
              </Typography>
            )}
            {description && (
              <Typography className="alert-description">
                {translate(description)}
              </Typography>
            )}
          </Box>
        </Box>

        {showCloseButton && (
          <IconButton
            className="close-button"
            onClick={onDismiss}
            disableRipple
            aria-label="Dismiss alert"
          >
            <Cancel width={'24px'} height={'24px'} />
          </IconButton>
        )}
      </Box>
    )
  }
)

AlertNotification.propTypes = {
  type: PropTypes.oneOf(['primary', 'secondary', 'inline']),
  status: PropTypes.oneOf(['information', 'success', 'warning', 'error']),
  title: PropTypes.string,
  description: PropTypes.string,
  isDismissible: PropTypes.bool,
  onDismiss: PropTypes.func,
}

AlertNotification.displayName = 'AlertNotification'
