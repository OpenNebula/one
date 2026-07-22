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
 * @returns {object} - Filter dropdown popper styles
 */
export const getPopperStyles = ({ theme }) => ({
  zIndex: theme.zIndex.modal + 3,
})

/**
 * @param {object} root0 - Params
 * @param {object} root0.theme - Current theme in use
 * @returns {object} - Filter panel styles
 */
export const getStyles = ({ theme }) => {
  const baseStyles = {
    zIndex: theme.zIndex.modal + 1,
  }

  const backdrop = {
    '& .filterpanel-backdrop': {
      backgroundColor: 'transparent',
      backdropFilter: 'blur(6px)',
      WebkitBackdropFilter: 'blur(6px)',
      zIndex: theme.zIndex.modal + 1,
    },
  }

  const paper = {
    '& .filterpanel-paper': {
      boxShadow: 'none',
      zIndex: theme.zIndex.modal + 2,
      width: {
        xs: '100vw',
        sm: '420px',
        md: '25vw',
      },
      minWidth: {
        md: '360px',
      },
      maxWidth: '480px',
      height: '100vh',
    },
  }

  const root = {
    '& .filterpanel-root': {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      width: '100%',
      borderRadius: `${theme.borderRadius?.['2xl']}px 0 0 ${theme.borderRadius?.['2xl']}px`,
      borderTop: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
      borderBottom: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
      borderLeft: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
      bgcolor: 'surface.primary',
    },
  }

  const header = {
    '& .filterpanel-header': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px',
      padding: `${theme.scale[600]}px ${theme.scale[600]}px ${theme.scale[200]}px`,
    },
  }

  const title = {
    '& .filterpanel-title': {
      color: 'text.headings',
      fontFamily: 'var(--type-font-family-primary, Inter)',
      fontSize: {
        xs: theme.fontSize.body.lg.mobile,
        sm: theme.fontSize.body.lg.tablet,
        md: theme.fontSize.body.lg.desktop,
      },
      fontStyle: 'normal',
      fontWeight: 600,
      lineHeight: {
        xs: theme.lineHeight.body.lg.mobile,
        sm: theme.lineHeight.body.lg.tablet,
        md: theme.lineHeight.body.lg.desktop,
      },
    },
  }

  const content = {
    '& .filterpanel-content': {
      display: 'flex',
      flex: '1 1 auto',
      flexDirection: 'column',
      gap: `${theme.scale[200]}px`,
      overflowY: 'auto',
      padding: `0 ${theme.scale[600]}px ${theme.scale[600]}px`,
    },
  }

  const field = {
    '& .filterpanel-field': {
      display: 'flex',
      flexDirection: 'column',
      gap: `${theme.scale[200]}px`,
    },
  }

  const label = {
    '& .filterpanel-label': {
      color: 'text.headings',
      fontSize: '0.8125rem',
      fontWeight: 500,
    },
  }

  const footer = {
    '& .filterpanel-footer': {
      display: 'flex',
      padding: '24px',
    },
  }

  const applyButton = {
    '& .filterpanel-apply-button': {
      width: '100%',
    },
  }

  return {
    ...baseStyles,
    ...backdrop,
    ...paper,
    ...root,
    ...header,
    ...title,
    ...content,
    ...field,
    ...label,
    ...footer,
    ...applyButton,
  }
}
