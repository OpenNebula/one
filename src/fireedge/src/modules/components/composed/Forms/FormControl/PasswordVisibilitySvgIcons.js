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
 * @param {object} root0.dimensions - Icon dimensions
 * @returns {Component} - EyeSvg component.
 */
export const EyeSvg = ({ dimensions = {}, ...opts }) => {
  const { width = 24, height = 24 } = dimensions

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...opts}
    >
      <path
        d="M3 13C6.6 5 17.4 5 21 13"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
      <path
        d="M12 17C10.3431 17 9 15.6569 9 14C9 12.3431 10.3431 11 12 11C13.6569 11 15 12.3431 15 14C15 15.6569 13.6569 17 12 17Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
    </svg>
  )
}

EyeSvg.propTypes = {
  dimensions: PropTypes.shape({
    width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
}

EyeSvg.displayName = 'EyeSvg'

/**
 * @param {object} root0 - Params
 * @param {object} root0.dimensions - Icon dimensions
 * @returns {Component} - CloseEyeSvg component.
 */
export const CloseEyeSvg = ({ dimensions = {}, ...opts }) => {
  const { width = 24, height = 24 } = dimensions

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...opts}
    >
      <path
        d="M19.5 16L17.0248 12.6038"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
      <path
        d="M12 17.5V14"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
      <path
        d="M4.5 16L6.96895 12.6124"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
      <path
        d="M3 8C6.6 16 17.4 16 21 8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
    </svg>
  )
}

CloseEyeSvg.propTypes = {
  dimensions: PropTypes.shape({
    width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
}

CloseEyeSvg.displayName = 'CloseEyeSvg'
