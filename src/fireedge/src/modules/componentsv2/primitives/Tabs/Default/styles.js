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

import { getStyles as getButtonStyles } from '@modules/componentsv2/primitives/Buttons/Default/styles'

const getTypeModifiers = ({ theme, type }) => {
  const modifiers = {
    default: {
      base: {
        borderRadius: `${theme.borderRadius.xlg}px`,
        border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
        padding: `${theme.borderRadius.md}px`,
      },
      tab: {
        borderRadius: `${theme.borderRadius.xlg}px`,

        '&:hover': {
          border: `${theme.borderWidth.sm}px solid ${theme.palette.surface.actionHover3}`,
          bgcolor: 'surface.actionHover2',
          color: 'text.actionHover2',
        },

        '&:focus-visible': {
          outline: `${theme.borderWidth.md}px solid ${theme.palette.border.focus2}`,
          border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
          outlineOffset: '2px',
        },

        '&.Mui-selected': {
          bgcolor: 'surface.action',
          border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
          color: 'text.onAction3',

          fontWeight: 600,
          '&:focus-visible': {
            bgcolor: 'surface.primary',
            color: 'text.focus',
            outline: `${theme.borderWidth.md}px solid ${theme.palette.border.focus}`,
            border: `${theme.borderWidth.sm}px solid ${theme.palette.border.focus2}`,
            outlineOffset: '2px',
          },
        },

        '&.Mui-disabled': {
          bgcolor: 'surface.disabled',
          border: `${theme.borderWidth.sm}px solid ${theme.palette.surface.disabled}`,
          color: 'text.onDisabled',
        },
      },
    },
    line: {
      base: {
        paddingTop: `${theme.borderRadius.md}px`,
        borderBottom: `${theme.borderWidth.md}px solid ${theme.palette.border.primary}`,
        borderRadius: 0,
      },
      tab: {
        border: 'none',
        borderRadius: 0,
        marginBottom: `-${theme.borderWidth.md}px`,
        borderBottom: `${theme.borderWidth.md}px solid ${theme.palette.border.primary}`,
        paddingBottom: `${theme.borderWidth.lg - theme.borderWidth.md}px`,

        '&:hover': {
          borderRadius: `${theme.borderRadius.xlg}px ${theme.borderRadius.xlg}px 0 0`,
          borderBottom: `${theme.borderWidth.md}px solid ${theme.palette.border.actionHover2}`,

          bgcolor: 'surface.actionHover3',
          color: 'text.actionHover',
        },

        '&:focus-visible': {
          outline: `${theme.borderWidth.md}px solid ${theme.palette.border.focus2}`,
          outlineOffset: '2px',
          borderRadius: `${theme.borderRadius.xlg}px`,
        },

        '&.Mui-selected': {
          bgcolor: 'surface.primary',
          borderBottom: `${theme.borderWidth.md}px solid ${theme.palette.border.action}`,
          color: 'text.action',

          fontWeight: 600,
          '&:hover': {
            borderRadius: `${theme.borderRadius.xlg}px ${theme.borderRadius.xlg}px 0 0`,
            borderBottom: `${theme.borderWidth.lg}px solid ${theme.palette.border.actionHover2}`,
            paddingBottom: 0,

            bgcolor: 'surface.actionHover3',
            color: 'text.actionHover',
          },

          '&:focus-visible': {
            color: 'text.focus',
            bgcolor: 'surface.primary',
            borderBottom: `${theme.borderWidth.md}px solid ${theme.palette.border.focus}`,
            outlineOffset: '2px',
            outline: `${theme.borderWidth.md}px solid ${theme.palette.border.focus}`,
          },
        },

        '&.Mui-disabled': {
          bgcolor: 'surface.primary',
          color: 'text.disabled',
          border: 'none',
          borderBottom: `${theme.borderWidth.md}px solid ${theme.palette.border.primary}`,
        },
      },
    },
  }

  return modifiers?.[type] ?? modifiers.default
}

/**
 * @param {object} root0 - Params
 * @param {object} root0.theme - Current theme in use
 * @param {string} root0.type - Tab type
 * @returns {object} - Tab SX style
 */
export const getStyles = ({ theme, type }) => {
  const { base: baseModifiers, tab: tabModifiers } = getTypeModifiers({
    theme,
    type,
  })
  const scrollButtonStyles = getButtonStyles({
    theme,
    type: 'transparent',
    iconOnly: true,
    size: 'small',
    isDestructive: false,
  })

  const baseStyle = {
    width: '100%',
    minWidth: 0,
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    bgcolor: 'surface.primary',

    ...baseModifiers,

    fontSize: {
      xs: theme.fontSize.body.sm.mobile,
      sm: theme.fontSize.body.sm.tablet,
      md: theme.fontSize.body.sm.desktop,
    },
    fontWeight: {
      xs: theme.fontWeight.body.sm.mobile,
      sm: theme.fontWeight.body.sm.tablet,
      md: theme.fontWeight.body.sm.desktop,
    },
    lineHeight: {
      xs: theme.lineHeight.body.sm.mobile,
      sm: theme.lineHeight.body.sm.tablet,
      md: theme.lineHeight.body.sm.desktop,
    },
  }

  const tabbar = {
    '& .tabbar': {
      width: '100%',
      minWidth: 0,
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      minHeight: 'unset',
    },
  }

  const tab = {
    '& .tab': {
      overflow: 'visible',
      display: 'inline-flex',
      padding: `${theme.scale[100]}px ${theme.scale[500]}px`,
      justifyContent: 'center',
      alignItems: 'center',
      gap: '7px',
      minHeight: 'unset',
      maxWidth: 'unset',
      border: `${theme.borderWidth.sm}px solid transparent`,
      ...tabModifiers,

      color: 'text.body',
      fontFamily: 'Inter',
      fontStyle: 'normal',
      fontWeight: 500,
    },
  }

  const label = {
    '& .tab-label': {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      gap: '7px',
    },
    '& .tab-title': {
      display: 'inline-grid',
      '&::after': {
        content: 'attr(data-text)',
        fontWeight: 600,
        height: 0,
        visibility: 'hidden',
        overflow: 'hidden',
        userSelect: 'none',
        pointerEvents: 'none',
      },
    },
    '& .tab-error .tab-starticon': {
      color: 'icon.error',
    },
  }

  const overrides = {
    '& .MuiTabs-scrollButtons': {
      ...scrollButtonStyles,
      marginInline: `${theme.scale[100]}px`,

      '&.Mui-disabled': {
        ...scrollButtonStyles['&.Mui-disabled'],
        opacity: 1,
      },
    },

    '& .MuiTabs-flexContainer': {
      width: 'max-content',
      minWidth: '100%',
    },

    '& .MuiTabs-indicator': {
      display: type === 'line' ? 'block' : 'none',
      height: `${theme.borderWidth.md}px`,
      backgroundColor: theme.palette.border.action,
    },

    '& .MuiTab-root': {
      textTransform: 'none !important',

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
    },
  }

  return {
    ...baseStyle,
    ...tabbar,
    ...tab,
    ...label,
    ...overrides,
  }
}
