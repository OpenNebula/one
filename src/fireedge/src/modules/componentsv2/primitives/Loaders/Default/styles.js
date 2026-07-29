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

/**
 * Get container size in pixels based on size prop.
 *
 * @param {object} theme - Theme object
 * @param {string} type - Type variant
 * @returns {number} - Size in pixels
 */
const getSvgFill = (theme, type) => {
  const colorMap = {
    primary: theme.palette.surface.actionHover,
    secondary: theme.palette.icon.onDisabled,
  }

  const svgFill = colorMap?.[type] ?? colorMap.primary

  return svgFill
}

/**
 * @param {object} root0 - Params
 * @param {object} root0.theme - Current theme in use
 * @param {string} root0.type - Type variant
 * @param {number} root0.dimensions - Side of viewbox
 * @returns {object} - Loader SX style
 */
export const getStyles = ({ theme, type, dimensions }) => {
  const svgFill = getSvgFill(theme, type)

  const baseStyle = {
    height: `${dimensions}px`,
    width: `${dimensions}px`,
  }

  const svgContainer = {
    '& .loader-circle-svg': {
      fill: 'none',
    },
    '& .loader-circle-svg circle': {
      fill: svgFill,
      color: svgFill,
    },
  }

  return {
    ...baseStyle,
    ...svgContainer,
  }
}
