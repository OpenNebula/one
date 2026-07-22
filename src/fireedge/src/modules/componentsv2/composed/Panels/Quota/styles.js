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
 * @returns {object} - Quota tab SX style
 */
export const getStyles = ({ theme }) => ({
  display: 'grid',
  width: '100%',
  flex: '1 1 auto',
  height: '100%',
  minHeight: 0,
  boxSizing: 'border-box',
  gridTemplateColumns: {
    xs: '1fr',
    md: 'minmax(280px, 0.38fr) minmax(0, 1fr)',
  },
  gap: `${theme.scale[400]}px`,
  alignItems: 'stretch',
  overflow: 'visible',

  '& .quota-controls-panel, & .quota-chart-panel': {
    minWidth: 0,
    minHeight: 0,
    borderRadius: `${theme.borderRadius.xlg}px`,
    border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
    bgcolor: 'surface.secondary',
    padding: `${theme.scale[400]}px`,
  },

  '& .quota-controls-panel': {
    display: 'flex',
    flexDirection: 'column',
    gap: `${theme.scale[300]}px`,
    overflow: 'auto',
  },

  '& .quota-section-title': {
    color: 'text.headings',
    fontSize: {
      xs: theme.fontSize.body.md.mobile,
      sm: theme.fontSize.body.md.tablet,
      md: theme.fontSize.body.md.desktop,
    },
    fontWeight: theme.fontWeight.body.md.desktop,
  },

  '& .quota-controls-content': {
    overflow: 'visible',
  },

  '& .quota-chart-panel': {
    display: 'flex',
    flexDirection: 'column',
    minHeight: 360,
    position: 'relative',
  },

  '& .quota-chart-panel > *': {
    flex: '1 1 auto',
    minHeight: 0,
  },
})
