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
 * @returns {object} - Numa hugepage SX style
 */
export const getStyles = ({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
  minHeight: 0,
  gap: `${theme.scale[300]}px`,
  padding: `${theme.scale[500]}px`,
  borderRadius: `${theme.borderRadius['3xl']}px`,
  border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
  bgcolor: 'surface.primary',

  '& .numa-hugepage__title': {
    color: 'text.headings',
  },

  '& .numa-hugepage__list': {
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    overflow: 'auto',
    padding: 0,
  },

  '& .numa-hugepage__row': {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: `${theme.scale[100]}px`,
    padding: `${theme.scale[150]}px 0`,
    color: 'text.body',
  },

  '& .numa-hugepage__row > *': {
    minWidth: 0,
  },

  '& .numa-hugepage__row--title': {
    color: 'text.headings',
    textTransform: 'uppercase',
    borderBottom: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
  },
})
