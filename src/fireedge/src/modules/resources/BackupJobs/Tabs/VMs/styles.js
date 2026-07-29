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
 * @returns {object} - Main tab container styles
 */
export const getContainerStyles = () => ({
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
})

/**
 * @param {object} root0 - Params
 * @param {object} root0.theme - Current theme in use
 * @returns {object} - Filter/table panel styles
 */
export const getPanelStyles = ({ theme }) => ({
  p: '16px',
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: `${theme.shape.borderRadius}px`,
})

/**
 * @param {object} root0 - Params
 * @param {object} root0.theme - Current theme in use
 * @returns {object} - Filter panel title styles
 */
export const getPanelTitleStyles = ({ theme }) => ({
  fontWeight: theme.typography.fontWeightBold,
  pb: '12px',
  mb: '12px',
  borderBottom: `1px solid ${theme.palette.divider}`,
})

/**
 * @param {object} root0 - Params
 * @param {object} root0.theme - Current theme in use
 * @returns {object} - Table panel header styles
 */
export const getTableHeaderStyles = ({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '16px',
  pb: '12px',
  mb: '12px',
  borderBottom: `1px solid ${theme.palette.divider}`,
})

export const tableTitleStyles = {
  fontWeight: 600,
}

export const alertStyles = {
  mb: '16px',
}
