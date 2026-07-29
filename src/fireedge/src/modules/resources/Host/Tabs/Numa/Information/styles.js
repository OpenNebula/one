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
 * @returns {object} - Numa node SX style
 */
export const getStyles = ({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: `${theme.scale[400]}px`,
  padding: `${theme.scale[400]}px 0 ${theme.scale[600]}px`,

  '& + &': {
    borderTop: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
  },

  '& .numa-node__header': {
    padding: `0 ${theme.scale[200]}px`,
    color: 'text.headings',
  },

  '& .numa-node__metrics': {
    display: 'grid',
    alignItems: 'stretch',
    gap: `${theme.scale[400]}px`,
    gridTemplateColumns: {
      xs: '1fr',
      md: 'repeat(2, minmax(0, 1fr))',
    },
  },

  '& .numa-node__metrics > *': {
    alignSelf: 'stretch',
    minWidth: 0,
  },

  '& .numa-node__section': {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    minHeight: 0,
    alignSelf: 'stretch',
    gap: `${theme.scale[300]}px`,
    padding: `${theme.scale[500]}px`,
    borderRadius: `${theme.borderRadius['3xl']}px`,
    border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
    bgcolor: 'surface.primary',
  },

  '& .numa-node__section-title': {
    color: 'text.headings',
  },

  '& .numa-node__cores': {
    display: 'grid',
    alignContent: 'start',
    gap: `${theme.scale[300]}px`,
    gridTemplateColumns: {
      xs: '1fr',
      sm: 'repeat(auto-fill, minmax(160px, 1fr))',
      xl: 'repeat(auto-fill, minmax(176px, 1fr))',
    },
  },
})
