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
 * @param {object} root0.theme - Current theme in use
 * @returns {object} - Tooltip content SX style
 */
export const getStyles = ({ theme }) => ({
  backgroundColor: theme.palette.surface.primary,
  color: theme.palette.text.headings,
  border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
  fontSize: {
    xs: theme.fontSize.body.sm.mobile,
    sm: theme.fontSize.body.sm.tablet,
    md: theme.fontSize.body.sm.desktop,
  },
  fontWeight: {
    xs: theme.fontWeight.body.sm.mobile,
    sm: theme.fontWeight.body.sm.tablet,
    md: theme.fontWeight.body.sm.desktop,
  },
  lineHeight: {
    xs: theme.lineHeight.body.sm.mobile,
    sm: theme.lineHeight.body.sm.tablet,
    md: theme.lineHeight.body.sm.desktop,
  },
  padding: `${theme.scale[150]}px ${theme.scale[400]}px`,
  borderRadius: `${theme.borderRadius.xlg}px`,
  boxShadow:
    '0 2px 4px -2px rgba(0, 0, 0, 0.10), 0 4px 6px -1px rgba(0, 0, 0, 0.10)',
  maxWidth: '300px',
  whiteSpace: 'normal',
  overflowWrap: 'anywhere',
})
