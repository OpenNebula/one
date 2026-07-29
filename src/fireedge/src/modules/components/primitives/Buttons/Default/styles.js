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

const paddingScale = (theme, size) =>
  ({
    small: `${theme.scale[150]}px ${theme.scale[400]}px`,
    medium: `${theme.scale[200]}px ${theme.scale[500]}px`,
  }?.[size])

const gapScale = (theme, size) =>
  ({
    small: `${theme.scale[200]}px`,
    medium: `${theme.scale[400]}px`,
  }?.[size])

/**
 * @param {object} root0 - Params
 * @param {string} root0.type - Button type
 * @param {object} root0.theme - Current theme in use
 * @param {boolean} root0.iconOnly - Render icon only
 * @param {string} root0.size - Size of button
 * @param {boolean} root0.isDestructive - Use destructive styles
 * @returns {object} - Button SX style
 */
export const getStyles = ({ type, theme, iconOnly, size, isDestructive }) => {
  const sizeKey = size === 'medium' ? 'md' : 'sm'
  const iconOnlySize = theme.scale[size === 'small' ? 700 : 800]

  const baseStyle = {
    width: 'fit-content',
    height: 'fit-content',
    minWidth: 0,
    boxSizing: 'border-box',
    textTransform: 'none',
    whiteSpace: 'nowrap',
    display: 'flex',
    flexWrap: 'nowrap',
    justifyContent: 'center',
    alignItems: 'center',
    padding: iconOnly ? 0 : paddingScale(theme, size),
    gap: iconOnly ? `${theme.scale[0]}px` : gapScale(theme, size),

    ...(iconOnly && {
      minWidth: `${iconOnlySize}px`,
      minHeight: `${iconOnlySize}px`,
      width: `${iconOnlySize}px`,
      height: `${iconOnlySize}px`,
      flexShrink: 0,

      '& svg': {
        width: `${theme.scale[500]}px`,
        height: `${theme.scale[500]}px`,
        flexShrink: 0,
      },
    }),
    borderRadius: `${theme.borderRadius.xlg}px`,
    '& .MuiButton-startIcon, & .MuiButton-endIcon': {
      width: '16px',
      height: '16px',
      aspectRatio: '1/1',
      display: 'flex',
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      margin: 0,
    },
    fontSize: {
      xs: theme.fontSize.body[sizeKey].mobile,
      sm: theme.fontSize.body[sizeKey].tablet,
      md: theme.fontSize.body[sizeKey].desktop,
    },
    fontWeight: 500,
    lineHeight: {
      xs: theme.lineHeight.body[sizeKey].mobile,
      sm: theme.lineHeight.body[sizeKey].tablet,
      md: theme.lineHeight.body[sizeKey].desktop,
    },
  }

  const types = {
    primary: {
      boxSizing: 'border-box',
      border: `${theme.borderWidth.sm}px solid ${
        theme.palette.border?.[isDestructive ? 'destructive' : 'action']
      }`,
      bgcolor: isDestructive ? 'surface.destructive' : 'surface.action',
      color: isDestructive ? 'text.onAction3' : 'text.onAction',
      '&:hover': {
        bgcolor: isDestructive
          ? 'surface.destructiveHover'
          : 'surface.actionHover',
        color: isDestructive ? 'text.onAction3' : 'text.onAction2',
        ...(iconOnly && {
          border: `${theme.borderWidth.sm}px solid ${theme.palette.border.actionHover}`,
        }),

        ...(isDestructive && {
          border: `${theme.borderWidth.sm}px solid ${theme.palette.border.destructiveHover}`,
        }),
      },
      '&:focus-visible': {
        outline: `${theme.borderWidth.md}px solid ${
          theme.palette.border?.[isDestructive ? 'destructive' : 'focus']
        }`,
        outlineOffset: '2px',
      },
      '&.Mui-disabled': {
        bgcolor: isDestructive ? 'surface.destructive' : 'surface.disabled',
        color: isDestructive ? 'text.onDestructive2' : 'text.onDisabled',
        border: `${theme.borderWidth.sm}px solid ${theme.palette.border.disabled2}`,
        ...(isDestructive && { opacity: 0.6 }),
      },
    },

    secondary: {
      border: `${theme.borderWidth.sm}px solid ${
        theme.palette.border?.[
          isDestructive ? 'destructiveSecondary' : 'primary'
        ]
      }`,
      bgcolor: isDestructive
        ? 'surface.destructiveSecondary'
        : 'surface.primary',
      color: isDestructive ? 'text.onDestructive' : 'text.body',

      '&:hover': {
        bgcolor: isDestructive ? 'surface.destructive' : 'surface.primary',
        color: isDestructive ? 'text.onDestructive2' : 'text.actionHover2',
      },
      '&:focus-visible': {
        outline: `${theme.borderWidth.md}px solid ${
          theme.palette.border?.[isDestructive ? 'destructive' : 'action']
        }`,
        outlineOffset: '2px',
        color: isDestructive ? 'text.onDestructive' : 'text.actionHover2',
      },
      '&.Mui-disabled': {
        border: `${theme.borderWidth.sm}px solid ${
          theme.palette.border?.[
            isDestructive ? 'destructiveSecondary' : 'disabled2'
          ]
        }`,
        bgcolor: isDestructive
          ? 'surface.destructiveSecondary'
          : 'surface.disabled2',
        color: isDestructive ? 'text.onDestructive' : 'text.disabled',
        ...(isDestructive && { opacity: 0.6 }),
      },
    },

    outline: {
      border: `${theme.borderWidth.sm}px solid ${
        theme.palette.border?.[isDestructive ? 'destructive' : 'action']
      }`,
      bgcolor: 'transparent',
      color: isDestructive ? 'text.onDestructive' : 'text.action',
      '&:hover': {
        border: `${theme.borderWidth.sm}px solid ${
          theme.palette.border?.[
            isDestructive ? 'destructiveHover' : 'actionHover'
          ]
        }`,
        bgcolor: isDestructive
          ? 'surface.destructiveSecondary'
          : 'surface.actionHover2',
        color: isDestructive ? 'text.onDestructive' : 'text.actionHover2',
      },
      '&:focus-visible': {
        outline: `${theme.borderWidth.md}px solid ${
          theme.palette.border?.[isDestructive ? 'destructive' : 'action']
        }`,
        outlineOffset: '2px',
        color: isDestructive ? 'text.onDestructive' : 'text.action',
      },
      '&.Mui-disabled': {
        border: `${theme.borderWidth.sm}px solid ${
          theme.palette.border?.[isDestructive ? 'destructive' : 'disabled']
        }`,
        bgcolor: isDestructive
          ? 'surface.destructiveDisabled'
          : 'surface.disabled',
        color: isDestructive ? 'text.onDestructive' : 'text.onDisabled',
        ...(isDestructive && { opacity: 0.6 }),
      },
    },

    transparent: {
      bgcolor: 'transparent',
      color: isDestructive ? 'text.onDestructive' : 'text.action',
      border: `${theme.borderWidth.sm}px solid transparent`,
      '&:hover': {
        bgcolor: isDestructive
          ? 'surface.destructiveDisabled'
          : 'surface.actionHover2',
        color: isDestructive ? 'text.onDestructive' : 'text.actionHover2',

        border: `${theme.borderWidth.sm}px solid ${
          theme.palette.border?.[
            isDestructive ? 'destructiveSecondary' : 'actionHover2'
          ]
        }`,
      },
      '&:focus-visible': {
        outlineOffset: '2px',
        outline: `${theme.borderWidth.md}px solid ${
          theme.palette.border?.[isDestructive ? 'destructive' : 'action']
        }`,
        color: isDestructive ? 'text.onDestructive' : 'text.action',
      },
      '&.Mui-disabled': {
        bgcolor: 'transparent',
        color: isDestructive ? 'text.onDestructive' : 'text.onDisabled',

        ...(isDestructive && { opacity: 0.6 }),
      },
    },
  }

  return { ...baseStyle, ...(types?.[type] || types.primary) }
}
