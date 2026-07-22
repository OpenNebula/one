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
 * @returns {object} - Showback tab SX style
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

  '& .showback-toolbar': {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: `${theme.scale[300]}px`,
  },

  '& .showback-summary': {
    display: 'grid',
    flex: '0 0 auto',
    gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
    gap: `${theme.scale[400]}px`,
  },

  '& .showback-chart': {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    minHeight: 0,
    borderRadius: `${theme.borderRadius.xlg}px`,
    border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
    bgcolor: 'surface.secondary',
    padding: `${theme.scale[200]}px`,
  },

  '& .showback-chart > *': {
    flex: '1 1 auto',
    minHeight: 0,
  },

  '& .showback-chart-compact': {
    minHeight: 320,
  },

  '& .showback-chart-detail': {
    flex: '1 1 520px',
    minHeight: 360,
  },
})
