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
import { Box, Typography } from '@mui/material'
import { getStyles } from '@modules/componentsv2/primitives/Progress/Bar/styles'
import { useTranslation } from '@ProvidersModule'

const normalizeThresholds = (thresholds) => {
  if (!Array.isArray(thresholds) || thresholds.length !== 2) return undefined

  const [low, high] = thresholds

  return Number.isFinite(low) && Number.isFinite(high) && low < high
    ? [low, high]
    : undefined
}

/**
 * ProgressBar component displays a horizontal progress indicator with
 * different sizes.
 *
 * @param {object} root0 - Params.
 * @param {string} root0.size - Size variant: 'extraSmall' | 'small' | 'medium' | 'large'.
 * @param {number} root0.value - Progress value (0-100) for determinate variant.
 * @param {number[]} root0.thresholds - Low/high values for range coloring.
 * @param {string} root0.label - Custom label text (overrides default).
 * @param {string} root0.isLabelVisible - Custom label text (overrides default).
 * @returns {Component} - ProgressBar component.
 */
export const ProgressBar = forwardRef(
  (
    {
      size = 'extraSmall',
      value = 0,
      thresholds,
      isLabelVisible = false,
      label,
      ...opts
    },
    ref
  ) => {
    const { translate } = useTranslation()
    const clampedValue = Math.min(100, Math.max(0, value))
    const normalizedThresholds = normalizeThresholds(thresholds)

    return (
      <Box
        ref={ref}
        sx={(theme) =>
          getStyles({
            theme,
            isLabelVisible,
            size,
            clampedValue,
            thresholds: normalizedThresholds,
          })
        }
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
        {...opts}
      >
        {label && (
          <Typography className="progress-label">{translate(label)}</Typography>
        )}
        <Box className="progress-track">
          <Box className="progress-fill" />
        </Box>
      </Box>
    )
  }
)

ProgressBar.propTypes = {
  size: PropTypes.oneOf(['extraSmall', 'small', 'medium', 'large']),
  value: PropTypes.number,
  thresholds: PropTypes.arrayOf(PropTypes.number),
  isLabelVisible: PropTypes.bool,
  label: PropTypes.string,
}

ProgressBar.displayName = 'ProgressBar'
