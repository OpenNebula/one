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
 * @returns {object} - Numa core SX style
 */
export const getStyles = ({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: `${theme.scale[200]}px`,
  minWidth: 0,
  padding: `${theme.scale[300]}px`,
  borderRadius: `${theme.borderRadius.xl}px`,
  border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
  bgcolor: 'surface.mute',

  '& .numa-core__title': {
    color: 'text.headings',
    textAlign: 'center',
  },

  '& .numa-core__cpus': {
    display: 'grid',
    gap: `${theme.scale[100]}px`,
    gridTemplateColumns: 'repeat(auto-fit, minmax(68px, 1fr))',
  },
})
