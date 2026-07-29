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
 * @param {object} root0.dimensions - Checkbox dimensions
 * @returns {Component} - CheckSvg component.
 */
export const CheckSvg = ({ dimensions = {}, ...opts }) => {
  const { width = 16, height = 12 } = dimensions

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 16 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...opts}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0.219783 6.21967C0.512676 5.92678 0.98755 5.92678 1.28044 6.21967L4.75011 9.68934L14.2198 0.21967C14.5127 -0.073223 14.9875 -0.0732233 15.2804 0.21967C15.5733 0.512563 15.5733 0.987437 15.2804 1.28033L5.28044 11.2803C4.98755 11.5732 4.51268 11.5732 4.21978 11.2803L0.219783 7.28033C-0.07311 6.98744 -0.07311 6.51256 0.219783 6.21967Z"
        fill="currentColor"
      />
    </svg>
  )
}

CheckSvg.propTypes = {
  dimensions: PropTypes.shape({
    width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
}

CheckSvg.displayName = 'CheckSvg'
