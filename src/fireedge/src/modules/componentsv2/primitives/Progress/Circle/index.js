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

import { Component, forwardRef, useMemo } from 'react'
import PropTypes from 'prop-types'
import { Box, Typography, useTheme } from '@mui/material'
import { getStyles } from '@modules/componentsv2/primitives/Progress/Circle/styles'
import { ProgressCircleSvg } from '@modules/componentsv2/primitives/Progress/Circle/svg'
import { useTranslation } from '@ProvidersModule'

const getDimensions = (theme, size) => {
  const dimensionMap = {
    extraSmall: {
      diameter: theme.scale[700],
      strokeWidth: theme.scale[50],
      fontSize: `${theme.scale[300]}px`,
      lineHeight: theme.lineHeight.body.caption,
    },
    small: {
      diameter: theme.scale[800],
      strokeWidth: theme.scale[50],
      fontSize: theme.fontSize.body.caption,
      lineHeight: theme.lineHeight.body.caption,
    },
    medium: {
      diameter: theme.scale[1300],
      strokeWidth: theme.scale[50],
      fontSize: theme.fontSize.body.sm,
      lineHeight: theme.lineHeight.body.sm,
    },
    large: {
      diameter: 155,
      strokeWidth: theme.scale[50],
      fontSize: theme.fontSize.body.lg,
      lineHeight: theme.lineHeight.body.lg,
    },
  }

  return dimensionMap?.[size] ?? dimensionMap.md
}

/**
 * ProgressCircle component displays a circular progress indicator with
 * different sizes.
 *
 * @param {object} root0 - Params.
 * @param {string} root0.size - Size variant: 'extraSmall' | 'small' | 'medium' | 'large'.
 * @param {number} root0.value - Progress value (0-100).
 * @param {boolean} root0.isLabelVisible - Show/Hide label.
 * @param {string} root0.label - Custom label text (overrides default percentage).
 * @returns {Component} - ProgressCircle component.
 */
export const ProgressCircle = forwardRef(
  (
    { size = 'medium', value = 0, isLabelVisible = false, label, ...opts },
    ref
  ) => {
    const { translate } = useTranslation()
    const theme = useTheme()
    const dimensions = useMemo(() => getDimensions(theme, size), [theme, size])
    const clampedValue = Math.min(100, Math.max(0, value))

    return (
      <Box
        ref={ref}
        sx={getStyles({
          theme,
          isLabelVisible,
          ...dimensions,
        })}
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
        {...opts}
      >
        <ProgressCircleSvg value={clampedValue} {...dimensions} />
        {label && (
          <Typography className="progress-circle-label">
            {translate(label)}
          </Typography>
        )}
      </Box>
    )
  }
)

ProgressCircle.propTypes = {
  size: PropTypes.oneOf(['extraSmall', 'small', 'medium', 'large']),
  value: PropTypes.number,
  isLabelVisible: PropTypes.bool,
  label: PropTypes.string,
}

ProgressCircle.displayName = 'ProgressCircle'
