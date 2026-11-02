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
import { Component, forwardRef } from 'react'
import PropTypes from 'prop-types'
import { customIcons } from '@modules/components/primitives/Icons/custom'

/**
 * Custom SVG icon
 *
 * @param {object} root0 - Props
 * @param {string} root0.name - Registered icon name
 * @param {number|string} root0.width - Icon width
 * @param {number|string} root0.height - Icon height
 * @param {string} root0.color - Optional icon color
 * @returns {Component} Custom icon
 */
export const Icon = forwardRef(
  ({ name, width = 24, height = 24, color, ...opts }, ref) => {
    const icon = customIcons[name]

    if (!icon) return null

    return (
      <Box
        component="svg"
        ref={ref}
        width={width}
        height={height}
        viewBox={icon.viewBox}
        fill="currentColor"
        color={color}
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        {...opts}
      >
        {icon.content}
      </Box>
    )
  }
)

Icon.propTypes = {
  name: PropTypes.oneOf(Object.keys(customIcons)).isRequired,
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  color: PropTypes.string,
}

Icon.displayName = 'Icon'
