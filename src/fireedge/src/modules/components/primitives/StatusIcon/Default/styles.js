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
 * @param {object} root0 - Props
 * @param {object} root0.theme - Current theme
 * @param {string} root0.status - Icon status
 * @param {number} root0.size - Optional icon size in pixels
 * @returns {object} Status icon styles
 */
export const getStyles = ({ theme, status, size }) => {
  const isSuccess = status === 'success'
  const color = theme.palette.icon[status] ?? theme.palette.icon.information
  const iconSize = size ?? theme.scale[600] - (isSuccess ? theme.scale[100] : 0)

  return {
    width: `${iconSize}px`,
    height: `${iconSize}px`,
    flexShrink: 0,
    color,
    borderRadius: '50%',
    ...(isSuccess && { backgroundColor: color }),
    '& path:first-of-type': {
      stroke: theme.palette.surface.primary,
      fill: color,
    },
    '& path:last-of-type': {
      stroke: theme.palette.surface.primary,
    },
  }
}
