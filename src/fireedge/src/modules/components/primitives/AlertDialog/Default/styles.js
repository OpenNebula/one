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
 * Builds the dialog styles, applying section overrides and remaining paper styles.
 *
 * @param {object} params - Style configuration
 * @param {object} params.theme - Current application theme
 * @param {object} params.sx - Paper styles with optional header, content and actions overrides
 * @returns {object} Dialog styles scoped to the backdrop, paper and section classes
 */
export const getStyles = ({ theme, sx = {} }) => {
  const { header = {}, content = {}, actions = {}, ...rest } = sx

  const AlertDialogHeader = {
    padding: 0,
    marginBottom: `${theme.scale[200]}px`,
    color: theme.palette.text.headings,
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
      xs: theme.lineHeight.heading.h5.mobile,
      sm: theme.lineHeight.heading.h5.tablet,
      md: theme.lineHeight.heading.h5.desktop,
    },

    ...header,
  }

  const AlertDialogContent = {
    minHeight: 0,
    padding: `${theme.scale[200]}px`,
    margin: `-${theme.scale[200]}px`,
    color: theme.palette.text.body,
    fontSize: {
      xs: theme.fontSize.body.sm.mobile,
      sm: theme.fontSize.body.sm.tablet,
      md: theme.fontSize.body.sm.desktop,
    },
    fontWeight: 500,
    lineHeight: {
      xs: theme.lineHeight.body.sm.mobile,
      sm: theme.lineHeight.body.sm.tablet,
      md: theme.lineHeight.body.sm.desktop,
    },

    ...content,
  }

  const AlertDialogActions = {
    padding: 0,
    marginTop: `${theme.scale[500]}px`,
    gap: `${theme.scale[200]}px`,

    ...actions,
  }

  return {
    '& .MuiBackdrop-root': {
      backgroundColor: 'transparent',
      backdropFilter: 'blur(6px)',
      WebkitBackdropFilter: 'blur(6px)',
    },

    '& .MuiPaper-root': {
      width: '475px',
      backgroundColor: 'surface.page',
      border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
      borderRadius: `${theme.borderRadius?.['3xl']}px`,
      padding: `${theme.scale[600]}px`,
      boxShadow: theme.boxShadow.lg,
      gap: 0,

      ...rest,
    },

    '& .alert-dialog-header.MuiDialogTitle-root': AlertDialogHeader,
    '& .alert-dialog-content.MuiDialogContent-root': AlertDialogContent,
    '& .alert-dialog-actions.MuiDialogActions-root': AlertDialogActions,
  }
}
