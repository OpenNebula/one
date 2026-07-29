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

const getAvatarSize = (theme, avatarSize) => {
  switch (avatarSize) {
    case 'small':
      return `${theme.scale[600]}px`
    case 'medium':
      return `${theme.scale[700]}px`
    default:
      return `${theme.scale[700]}px`
  }
}

/**
 * @param {object} root0 - Params
 * @param {object} root0.theme - MUI theme
 * @param {string} root0.avatarSize - Avatar size
 * @returns {object} - Sidebar styles
 */
export const getStyles = ({ theme, avatarSize }) => {
  const userAvatar = {
    padding: 0,
    display: 'flex',
    background: 'transparent',
    border: 'none',
    width: '100%',
    alignItems: 'center',
    cursor: 'pointer',
    borderRadius: `${theme.borderRadius['2xl']}px`,

    '&.expanded': {
      padding: `${theme.scale[200]}px ${theme.scale[200]}px ${theme.scale[100]}px`,
    },

    '& .avatar': {
      border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
      borderRadius: `${theme.borderRadius.xlg}px`,
      width: getAvatarSize(theme, avatarSize),
      height: getAvatarSize(theme, avatarSize),
    },

    '& .info': {
      marginLeft: `${theme.scale[200]}px`,
      display: 'flex',
      flexGrow: 1,
      flexDirection: 'column',
      alignItems: 'flex-start',

      '& .title': {
        color: 'text.headings',
        fontSize: {
          xs: theme.fontSize.body.sm.mobile,
          sm: theme.fontSize.body.sm.tablet,
          md: theme.fontSize.body.sm.desktop,
        },
        fontWeight: {
          xs: theme.fontWeight.heading.h6.mobile,
          sm: theme.fontWeight.heading.h6.tablet,
          md: theme.fontWeight.heading.h6.desktop,
        },
        lineHeight: {
          xs: theme.lineHeight.body.sm.mobile,
          sm: theme.lineHeight.body.sm.tablet,
          md: theme.lineHeight.body.sm.desktop,
        },
      },

      '& .subtitle': {
        color: 'text.body',
        fontSize: {
          xs: theme.fontSize.body.caption.mobile,
          sm: theme.fontSize.body.caption.tablet,
          md: theme.fontSize.body.caption.desktop,
        },
        fontWeight: {
          xs: theme.fontWeight.body.caption.mobile,
          sm: theme.fontWeight.body.caption.tablet,
          md: theme.fontWeight.body.caption.desktop,
        },
        lineHeight: {
          xs: theme.lineHeight.body.caption.mobile,
          sm: theme.lineHeight.body.caption.tablet,
          md: theme.lineHeight.body.caption.desktop,
        },
      },
    },
  }

  const baseStyles = {
    '&.menu-dropdown': {
      ...userAvatar,

      '&:hover': {
        backgroundColor: 'surface.actionHover4',
      },

      '&:active, &.open': {
        bgcolor: 'surface.focus2',
        outline: `${theme.borderWidth.md}px solid ${theme.palette.border.focus2}`,
        outlineOffset: `${theme.borderWidth.md}px`,
      },

      '& .icon': {
        width: '16px',
        height: '16px',
        color: 'icon.primary',
        strokeWidth: 1.6,
      },
    },

    '&.popup': {
      minWidth: '224px',
      border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
      borderRadius: `${theme.borderRadius.xlg}px`,
    },
  }

  return {
    ...baseStyles,
  }
}
