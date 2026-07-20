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
 * @returns {object} - Authentication tab SX style
 */
export const getStyles = ({ theme }) => ({
  '& .MuiBackdrop-root': {
    backgroundColor: 'transparent',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
  },

  '& .MuiPaper-root': {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 0,
    padding: `${theme.scale[500]}px ${theme.scale[600]}px`,
    width: 'min(560px, calc(100vw - 32px))',
    borderRadius: `${theme.borderRadius?.['3xl']}px`,
    border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
    bgcolor: 'surface.page',
    boxShadow:
      '0 4px 6px -4px rgba(0, 0, 0, 0.10), 0 10px 15px -13px rgba(0, 0, 0, 0.10)',
  },

  '& .MuiDialogTitle-root': {
    padding: 0,
    marginBottom: `${theme.scale[500]}px`,
    color: 'text.headings',
  },

  '& .MuiDialogContent-root': {
    overflow: 'visible',
    padding: `${theme.scale[100]}px`,
    boxSizing: 'border-box',
    color: 'text.body',
  },

  '& .MuiDialogActions-root': {
    padding: 0,
    gap: `${theme.scale[300]}px`,
  },
})
