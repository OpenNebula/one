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
 * @param {object} root0.theme - Current theme
 * @returns {object} Application tab styles
 */
export const getStyles = ({ theme }) => ({
  display: 'flex',
  flex: '1 1 0',
  flexDirection: 'column',
  width: '100%',
  minWidth: 0,
  minHeight: 0,
  gap: `${theme.scale[600]}px`,
  overflow: 'hidden',
  '& .tab-content': {
    display: 'flex',
    flex: '1 1 0',
    flexDirection: 'column',
    minWidth: 0,
    minHeight: 0,
    overflow: 'auto',
    p: `${theme.scale[100]}px`,
  },
})

/**
 * @param {object} root0 - Params
 * @param {object} root0.theme - Current theme
 * @returns {object} About section styles
 */
export const getAboutStyles = ({ theme }) => ({
  display: 'grid',
  gap: `${theme.scale[400]}px`,
  minWidth: 0,
  p: `${theme.scale[600]}px`,
  border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
  borderRadius: `${theme.borderRadius['3xl']}px`,
  bgcolor: 'surface.primary',
  '& .about-step': {
    display: 'grid',
    gap: `${theme.scale[300]}px`,
    minWidth: 0,
  },
})
