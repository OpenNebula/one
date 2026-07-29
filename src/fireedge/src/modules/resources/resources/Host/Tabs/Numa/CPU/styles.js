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
 * @param {string} root0.bgColor - CPU background color
 * @param {boolean} root0.attachedToVm - CPU is attached to a VM
 * @returns {object} - Numa CPU SX style
 */
export const getStyles = ({ theme, bgColor, attachedToVm }) => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  gap: `${theme.scale[50]}px`,
  minWidth: 0,
  minHeight: `${theme.scale[1200]}px`,
  padding: `${theme.scale[150]}px ${theme.scale[200]}px`,
  borderRadius: `${theme.borderRadius.lg}px`,
  border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
  bgcolor: bgColor,
  color: 'text.headings',

  '& .numa-cpu__label, & .numa-cpu__status': {
    textAlign: 'center',
  },

  '& .numa-cpu__status': {
    cursor: attachedToVm ? 'pointer' : 'default',
    textDecoration: attachedToVm ? 'underline' : 'none',
  },
})
