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
 * @returns {object} Form dialog backdrop styles
 */
export const getBackdropStyles = () => ({
  backgroundColor: 'transparent',
  backdropFilter: 'blur(6px)',
  WebkitBackdropFilter: 'blur(6px)',
})

/**
 * @param {object} root0 - Params
 * @param {object} root0.theme - Current theme
 * @returns {object} Form dialog styles
 */
export const getStyles = ({ theme }) => ({
  '&&': {
    width: {
      xs: 'calc(100vw - 32px)',
      md: '960px',
      lg: '1200px',
    },
    maxWidth: 'calc(100vw - 32px)',
    maxHeight: 'calc(100vh - 32px)',
  },

  '& .MuiDialogContent-root': {
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
    padding: `${theme.scale[100]}px`,
    boxSizing: 'border-box',
    minHeight: 0,
    maxHeight: 'none',
    overflowY: 'auto',
  },

  '& .form-stepper-root': {
    width: '100%',
    padding: 0,
  },

  '& .form-dialog-header': {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: `${theme.scale[400]}px`,
    minHeight: `${theme.scale[900]}px`,
    flexShrink: 0,
  },

  '& .form-dialog-title': {
    margin: 0,
    color: 'text.headings',
    fontSize: {
      xs: theme.fontSize.heading.h6.mobile,
      sm: theme.fontSize.heading.h6.tablet,
      md: theme.fontSize.heading.h6.desktop,
    },
    fontWeight: {
      xs: theme.fontWeight.heading.h6.mobile,
      sm: theme.fontWeight.heading.h6.tablet,
      md: theme.fontWeight.heading.h6.desktop,
    },
    lineHeight: {
      xs: theme.lineHeight.heading.h6.mobile,
      sm: theme.lineHeight.heading.h6.tablet,
      md: theme.lineHeight.heading.h6.desktop,
    },
  },

  '& .form-stepper-buttons': {
    marginTop: `${theme.scale[600]}px`,
  },

  '& .MuiDialogActions-root:empty': {
    display: 'none',
  },
})
