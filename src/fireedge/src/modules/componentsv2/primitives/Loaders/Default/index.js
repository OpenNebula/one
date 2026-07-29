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
import { Box, useTheme } from '@mui/material'
import { getStyles } from '@modules/componentsv2/primitives/Loaders/Default/styles'
import { LoaderCircleSvg } from '@modules/componentsv2/primitives/Loaders/Default/svg'

/**
 * Get container size in pixels based on size prop.
 *
 * @param {object} theme - Theme object
 * @param {string} size - Size variant
 * @returns {number} - Size in pixels
 */
const getDimensions = (theme, size) => {
  const sizeMap = {
    large: theme.scale[900],
    medium: theme.scale[800],
    small: theme.scale[600],
    'extra-small': theme.scale[500],
  }

  return (sizeMap?.[size] ?? sizeMap.medium) + 15 // Static 10px offset
}

/**
 * Loader component displays an animated spinner with different types and sizes.
 *
 * @param {object} root0 - Params
 * @param {string} root0.type - Loader type: 'primary' | 'secondary'
 * @param {string} root0.size - Loader size: 'large' | 'medium' | 'small' | 'xsmall'
 * @param {string} root0.ariaLabel - Aria label for screen readers
 * @returns {Component} - Loader component
 */
export const Loader = forwardRef(
  ({ type, size, ariaLabel = 'Loading', ...opts }, ref) => {
    const theme = useTheme()
    const dimensions = getDimensions(theme, size)

    return (
      <Box ref={ref} sx={getStyles({ theme, type, dimensions })}>
        <LoaderCircleSvg viewBoxSide={dimensions} />
      </Box>
    )
  }
)

Loader.propTypes = {
  type: PropTypes.oneOf(['primary', 'secondary']),
  size: PropTypes.oneOf(['large', 'medium', 'small', 'xsmall', 'x-small']),
  ariaLabel: PropTypes.string,
}

Loader.displayName = 'Loader'
