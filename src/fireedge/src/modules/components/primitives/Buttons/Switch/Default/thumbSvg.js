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
 * @param {number} root0.knob -  Side lengths
 * @returns {Component} - ThumbSvg component.
 */
export const ThumbSvg = ({ knob }) => {
  const { height, width } = knob
  const cx = width / 2
  const cy = height / 2
  const r = Math.min(width, height) / 2

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx={cx} cy={cy} r={r} fill="currentColor" />
    </svg>
  )
}

ThumbSvg.propTypes = {
  knob: PropTypes.object,
}

ThumbSvg.displayName = 'ThumbSvg'
