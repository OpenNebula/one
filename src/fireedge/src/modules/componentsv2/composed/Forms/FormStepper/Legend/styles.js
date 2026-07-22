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
 * @param {object} root0 - Params
 * @param {string} root0.type - Button type
 * @param {object} root0.theme - Current theme in use
 * @param {boolean} root0.iconOnly - Render icon only
 * @param {string} root0.size - Size of button
 * @returns {object} - Button SX style
 */
export const getStyles = ({ type, theme, iconOnly, size }) => {
  const baseStyle = {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
    padding: `${theme.scale[200]}px 0 ${theme.scale[200]}px 0`,
    margin: `${theme.scale[200]}px 0 ${theme.scale[200]}px 0`,
  }

  const tooltipIcon = {
    '& .form-legend-tooltip-icon': {
      color: 'text.action',
    },
  }

  return { ...baseStyle, ...tooltipIcon }
}
