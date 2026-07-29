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
import PropTypes from 'prop-types'
import { Component } from 'react'

/**
 * @param {object} root0 - Params
 * @param {number} root0.diameter - Circle diameter
 * @param {number} root0.strokeWidth - SVG stroke width
 * @param {number} root0.value - Circle progress level. Should be clamped 0-100
 * @returns {Component} - ProgressCircleSvg component.
 */
export const ProgressCircleSvg = ({ diameter, strokeWidth, value }) => {
  const viewBoxSide = diameter + strokeWidth + 1 // Adding a 1px offset
  const viewBoxDimensions = `0 0 ${viewBoxSide} ${viewBoxSide}`

  const circumference = diameter * Math.PI
  const radius = diameter / 2
  const strokeDashoffset = circumference - (value / 100) * circumference

  return (
    <svg className="progress-svg" viewBox={viewBoxDimensions}>
      {/* Background track */}
      <circle className="progress-circle-track" cx="50%" cy="50%" r={radius} />
      {/* Progress fill */}
      <circle
        className="progress-circle-fill"
        cx="50%"
        cy="50%"
        r={radius}
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
      />
    </svg>
  )
}

ProgressCircleSvg.propTypes = {
  diameter: PropTypes.number,
  strokeWidth: PropTypes.number,
  value: PropTypes.number,
}

ProgressCircleSvg.displayName = 'ProgressCircleSvg'
