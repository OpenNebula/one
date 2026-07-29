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
 * @param {number} root0.viewBoxSide -  Side length of viewbox
 * @returns {Component} - LoaderCircleSvg component.
 */
export const LoaderCircleSvg = ({ viewBoxSide }) => {
  const viewBoxDimensions = `0 0 ${viewBoxSide} ${viewBoxSide}`

  return (
    <svg className="loader-circle-svg" viewBox={viewBoxDimensions}>
      <circle cx="25.5" cy="5.5" r="2.5" />
      <circle cx="25.7" cy="44.7" r="1.7" />
      <circle cx="9" cy="11" r="1" />
      <circle cx="9.5" cy="38.5" r="1.5" />
      <circle cx="5.65" cy="25.65" r="1.65" />
      <circle cx="39.3" cy="11.3" r="2.3" />
      <circle cx="39" cy="38" r="2" />
      <circle cx="43.2" cy="25.2" r="2.2" />
    </svg>
  )
}

LoaderCircleSvg.propTypes = {
  dimensions: PropTypes.number,
  viewBoxSide: PropTypes.number,
}

LoaderCircleSvg.displayName = 'LoaderCircleSvg'
