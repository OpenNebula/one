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

import { Component, forwardRef, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { Box, Typography, Link } from '@mui/material'
import { InfoEmpty, Check, WarningCircle, Cancel } from 'iconoir-react'
import { getStyles } from '@modules/componentsv2/primitives/Snackbar/Default/styles'
import { Button } from '@modules/componentsv2/primitives/Buttons'
import { useTranslation } from '@ProvidersModule'

/**
 * Get status icon based on the status type.
 *
 * @param {string} status - Snackbar status
 * @returns {Component} - Icon component for the status
 */
const getStatusIcon = (status) => {
  const iconMap = {
    default: InfoEmpty,
    information: InfoEmpty,
    success: Check,
    warning: WarningCircle,
    error: WarningCircle,
  }

  return iconMap?.[status] ?? iconMap?.default
}

/**
 * Snackbar component displays quick feedback notifications with different
 * statuses (default, information, success, warning, error)
 *
 * @param {object} root0 - Params
 * @param {string} root0.status - Snackbar status: 'default' | 'information' | 'success' | 'warning' | 'error'
 * @param {string} root0.title - Snackbar title text
 * @param {string} root0.description - Snackbar description text
 * @param {string} root0.linkText - Link text to display
 * @param {string} root0.linkHref - Link URL
 * @param {Function} root0.onLinkClick - Link click handler
 * @param {boolean} root0.isDismissible - Show close button
 * @param {Function} root0.onDismiss - Callback when close button is clicked
 * @param {boolean} root0.isProgressShow - Show progress indicator
 * @param {number} root0.progress - Progress value (0-100), undefined for indeterminate
 * @returns {Component} - Snackbar component
 */
export const Snackbar = forwardRef(
  (
    {
      status = 'default',
      title,
      description,
      linkText,
      linkHref,
      onLinkClick,
      isDismissible = true,
      onDismiss = () => {},
      isProgressShow = false,
      progress,
      progressDuration = 5000,
      progressTickMs = 50,
      onProgressEnd = () => {},
      ...opts
    },
    ref
  ) => {
    const { translate } = useTranslation()
    const [internalProgress, setInternalProgress] = useState(0)
    const clampProgress = (p) => Math.min(100, Math.max(0, p))

    useEffect(() => {
      if (!isProgressShow || progress !== undefined) return

      const increment = 100 / (progressDuration / progressTickMs)
      const interval = setInterval(() => {
        setInternalProgress((prev) => Math.min(100, prev + increment))
      }, progressTickMs)

      const timeout = setTimeout(() => {
        clearInterval(interval)
        onProgressEnd()
      }, progressDuration)

      return () => {
        clearInterval(interval)
        clearTimeout(timeout)
      }
    }, [isProgressShow])

    const StatusIcon = getStatusIcon(status)

    return (
      <Box
        ref={ref}
        sx={(theme) =>
          getStyles({
            theme,
            status,
            progress: clampProgress(progress ?? internalProgress),
            progressTickMs,
          })
        }
        role="alert"
        {...opts}
      >
        <Box className="snackbar-content-wrapper">
          <StatusIcon className="status-icon" />
          <Box className="snackbar-text-container">
            <Box className="snackbar-text-body">
              {!!title && (
                <Typography className="snackbar-title">
                  {translate(title)}
                </Typography>
              )}
              {!!description && (
                <Typography className="snackbar-description">
                  {translate(description)}
                </Typography>
              )}
            </Box>

            {!!linkText && (
              <Link
                className="snackbar-link"
                href={linkHref}
                onClick={onLinkClick}
                underline="none"
              >
                {translate(linkText)}
              </Link>
            )}
          </Box>
        </Box>
        {isDismissible && (
          <Box className="snackbar-close-button">
            <Button
              onClick={onDismiss}
              aria-label="Close snackbar"
              iconOnly={<Cancel width={'24px'} height={'24px'} />}
              type="transparent"
            />
          </Box>
        )}
        {isProgressShow && (
          <Box className="snackbar-progress-bar-track">
            <Box className="snackbar-progress-bar-fill" />
          </Box>
        )}
      </Box>
    )
  }
)

Snackbar.propTypes = {
  status: PropTypes.oneOf([
    'default',
    'information',
    'success',
    'warning',
    'error',
  ]),
  title: PropTypes.string,
  description: PropTypes.string,
  linkText: PropTypes.string,
  linkHref: PropTypes.string,
  onLinkClick: PropTypes.func,
  isDismissible: PropTypes.bool,
  onDismiss: PropTypes.func,
  isProgressShow: PropTypes.bool,
  progress: PropTypes.number,
  progressDuration: PropTypes.number,
  progressTickMs: PropTypes.number,
  onProgressEnd: PropTypes.func,
}

Snackbar.displayName = 'Snackbar'
