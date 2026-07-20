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
import { Component, forwardRef } from 'react'

import { getStyles } from '@modules/componentsv2/primitives/Progress/Segments/styles'

const SEGMENT_TONES = [
  'neutral',
  'success',
  'warning',
  'error',
  'information',
  'action',
  'focus',
]

const getToneClassName = (tone = 'neutral') =>
  `progress-bar-segments-tone-${
    SEGMENT_TONES.includes(tone) ? tone : 'neutral'
  }`

/**
 * Progress bar composed of multiple proportional segments.
 *
 * @param {object} props - Component properties
 * @param {object[]} props.segments - Progress segments
 * @param {number} props.total - Total value represented by the track
 * @param {'extraSmall'|'small'|'medium'|'large'} props.size - Bar size
 * @param {string} props.ariaLabel - Accessible progress description
 * @param {string} props.className - Additional class name
 * @param {object} ref - Forwarded ref
 * @returns {Component} Segmented progress bar
 */
export const ProgressBarSegments = forwardRef(
  (
    { segments = [], total, size = 'extraSmall', ariaLabel, className = '' },
    ref
  ) => {
    const normalizedSegments = segments
      .map((segment, index) => ({
        ...segment,
        key: segment.id ?? index,
        value: Math.max(0, Number(segment.value) || 0),
      }))
      .filter(({ value }) => value > 0)
    const segmentsTotal = normalizedSegments.reduce(
      (sum, { value }) => sum + value,
      0
    )
    const normalizedTotal = Math.max(0, Number(total) || 0, segmentsTotal)
    const remainder = Math.max(0, normalizedTotal - segmentsTotal)
    const showRemainder = remainder > 0 || normalizedSegments.length === 0

    return (
      <Box
        ref={ref}
        className={`progress-bar-segments ${className}`}
        role="progressbar"
        aria-label={ariaLabel}
        aria-valuemin={0}
        aria-valuemax={normalizedTotal}
        aria-valuenow={Math.min(segmentsTotal, normalizedTotal)}
        sx={(theme) => getStyles({ theme, size })}
      >
        {normalizedSegments.map((segment) => (
          <Box
            key={segment.key}
            className={`progress-bar-segments-segment ${getToneClassName(
              segment.tone
            )}`}
            style={{ flexGrow: segment.value }}
          />
        ))}
        {showRemainder && (
          <Box
            className="progress-bar-segments-remainder"
            style={{ flexGrow: remainder || 1 }}
          />
        )}
      </Box>
    )
  }
)

ProgressBarSegments.propTypes = {
  segments: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      value: PropTypes.number.isRequired,
      tone: PropTypes.oneOf(SEGMENT_TONES),
    })
  ),
  total: PropTypes.number,
  size: PropTypes.oneOf(['extraSmall', 'small', 'medium', 'large']),
  ariaLabel: PropTypes.string,
  className: PropTypes.string,
}

ProgressBarSegments.displayName = 'ProgressBarSegments'
