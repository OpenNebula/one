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
 * @returns {object} - User groups tab SX style
 */
export const getStyles = ({ theme }) => ({
  display: 'flex',
  width: '100%',
  flex: '1 1 auto',
  height: '100%',
  minHeight: 0,
  boxSizing: 'border-box',
  flexDirection: 'column',
  alignItems: 'stretch',
  gap: `${theme.scale[400]}px`,
  overflow: 'auto',

  '& .user-groups-actions': {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: `${theme.scale[300]}px`,
  },

  '& .user-groups-section': {
    display: 'flex',
    flexDirection: 'column',
    flex: '0 0 auto',
    gap: `${theme.scale[300]}px`,
  },

  '& .user-groups-section-title': {
    color: 'text.headings',
    fontSize: {
      xs: theme.fontSize.body.md.mobile,
      sm: theme.fontSize.body.md.tablet,
      md: theme.fontSize.body.md.desktop,
    },
    fontWeight: theme.fontWeight.body.md.desktop,
  },

  '& .user-groups-list': {
    display: 'flex',
    flexDirection: 'column',
    gap: `${theme.scale[300]}px`,
  },

  '& .user-groups-card': {
    minWidth: 0,
    cursor: 'pointer',
  },
})
