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
 * @returns {object} - Header styles
 */
export const getStyles = ({ theme }) => {
  const baseStyles = {
    display: 'flex',
    alignItems: 'center',
    bgcolor: 'surface.primary',
    color: 'text.body',
    borderBottom: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
    height: 'var(--sidebar-header-height)',
    padding: `0 ${theme.scale[200]}px`,
    position: 'fixed',
    top: 0,
    zIndex: theme.zIndex.topBar,
    left: `calc(var(--sidebar-width) + ${theme.borderWidth.sm}px)`,
    width: `calc(100% - var(--sidebar-width) - ${theme.borderWidth.sm}px)`,
  }

  const breadcrumbs = {
    '& .header-breadcrumbs': {
      display: 'flex',
      alignItems: 'center',
      flex: '1 0 0',

      '& .breadcrumb-home': {
        display: 'flex',
        alignItems: 'center',
      },
    },

    '& .breadcrumb-links ol': {
      display: 'flex',
      gap: `${theme.scale[100]}px`,
      flex: '1 0 0',
      alignItems: 'center',

      '& .MuiBreadcrumbs-separator': {
        margin: 0,
      },

      '& .breadcrumb-item, a': {
        fontStyle: 'normal',
        fontFamily: 'Inter',
        fontWeight: {
          xs: theme.typography.fontWeightMedium,
          sm: theme.typography.fontWeightMedium,
          md: theme.typography.fontWeightMedium,
        },
        fontSize: {
          xs: theme.fontSize.body.sm.mobile,
          sm: theme.fontSize.body.sm.tablet,
          md: theme.fontSize.body.sm.desktop,
        },
        lineHeight: {
          xs: theme.lineHeight.body.sm.mobile,
          sm: theme.lineHeight.body.sm.tablet,
          md: theme.lineHeight.body.sm.desktop,
        },

        '&.selected': {
          color: 'text.action',
        },
      },
    },

    '*:not(.header-slot, .header-slot *)': {
      color: 'text.body',
    },
  }

  const slots = {
    '& .header-slots': {
      display: 'flex',
      alignItems: 'center',
      marginLeft: 'auto',
      height: '100%',
      paddingTop: '1px',
      gap: `${theme.scale[200]}px`,

      '& .header-slot': {
        display: 'flex',
        minWidth: 0,

        '&:empty': {
          display: 'none',
        },
      },
    },
  }

  const homeButton = {
    '& .header-home-button': {
      mr: `${theme.scale[200]}px`,
      padding: `${theme.scale[200]}px`,

      '&:active': {
        outline: `${theme.borderWidth.md}px solid ${theme.palette.primary.main}`,
        outlineOffset: `${theme.scale[50]}px`,
      },

      '& svg': {
        height: `${theme.scale[500]}px`,
        width: `${theme.scale[500]}px`,
        strokeWidth: 2.5,
      },
    },
  }

  const divider = {
    '& .header-divider': {
      margin: `${theme.scale[100]}px ${theme.scale[150]}px ${theme.scale[100]}px 0`,
    },
  }

  const overrides = {
    '& .MuiBreadcrumbs-separator': {
      ml: `${theme.scale[100]}px`,
      mr: `${theme.scale[100]}px`,
    },
  }

  return {
    ...baseStyles,
    ...breadcrumbs,
    ...slots,
    ...homeButton,
    ...divider,
    ...overrides,
  }
}
