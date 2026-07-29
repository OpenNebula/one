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
 * @returns {object} - Slot styles
 */
export const getStyles = ({ theme }) => {
  const button = {
    '& .header-usergroup-button': {
      display: 'flex',
      padding: `${theme.scale[300]}px ${theme.scale[400]}px`,
      gap: `${theme.scale[200]}px`,

      '&:hover:not(.is-open)': {
        borderColor: 'border.actionHover',

        '& .MuiButton-endIcon svg': {
          color: 'icon.actionHover',
        },
      },

      '&.is-open, &:active': {
        outline: `${theme.borderWidth.md}px solid ${theme.palette.primary.main}`,
        outlineOffset: `1px`,
      },

      '& .MuiButton-startIcon svg, & .MuiButton-endIcon svg': {
        width: `${theme.scale[500]}px`,
        height: `${theme.scale[500]}px`,
        strokeWidth: 2,
        color: 'icon.primary',
      },

      '& .label': {
        fontWeight: {
          xs: theme.fontWeight.body.sm.mobile,
          sm: theme.fontWeight.body.sm.tablet,
          md: theme.fontWeight.body.sm.desktop,
        },
        color: 'text.disabled',
      },
    },
  }

  const menu = {
    '& .header-usergroup-menu': {
      display: 'flex',
      flexDirection: 'column',
      padding: `${theme.scale[100]}px`,
      borderRadius: `${theme.borderRadius.xlg}px`,
      border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
      bgcolor: 'surface.primary',
      boxShadow:
        '0 4px 6px -4px rgba(0, 0, 0, 0.10), 0 10px 15px -13px rgba(0, 0, 0, 0.10)',

      '& .title': {
        color: 'text.headings',
        fontWeight: {
          xs: theme.fontWeight.heading.h6.mobile,
          sm: theme.fontWeight.heading.h6.tablet,
          md: theme.fontWeight.heading.h6.desktop,
        },
        padding: `${theme.scale[150]}px ${theme.scale[200]}px ${theme.scale[150]}px ${theme.scale[300]}px`,
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
      },

      '& .search-container': {
        padding: `${theme.scale[150]}px ${theme.scale[300]}px`,

        '& .divider': {
          bgcolor: 'border.primary',
        },

        '& .search': {
          margin: `${theme.scale[200]}px ${theme.scale[0]}px`,

          '& .textfield-input-wrapper': {
            padding: `${theme.scale[300]}px ${theme.scale[400]}px`,

            '& .textfield-adornment-start': {
              padding: '0',

              '& svg': {
                width: `${theme.scale[500]}px`,
                height: `${theme.scale[500]}px`,
                strokeWidth: 2,
                color: 'icon.primary',
              },
            },

            '& .textfield-input': {
              padding: '0',
            },
          },
        },
      },

      '& .usergroup-options': {
        display: 'flex',
        flexDirection: 'column',
        maxHeight: `${theme.scale[1700] + theme.scale[1100]}px`,
        overflowY: 'auto',

        '& .usergroup-option': {
          padding: `${theme.scale[150]}px ${theme.scale[200]}px ${theme.scale[150]}px ${theme.scale[300]}px`,
          display: 'flex',
          gap: `${theme.scale[200]}px`,
          alignItems: 'center',
          borderRadius: `${theme.borderRadius.xlg}px`,
          cursor: 'pointer',
          border: 'none',
          backgroundColor: 'transparent',

          '& .icon': {
            display: 'flex',
            color: 'icon.primary',
          },

          '& .label': {
            fontWeight: {
              xs: theme.typography.fontWeightMedium,
              sm: theme.typography.fontWeightMedium,
              md: theme.typography.fontWeightMedium,
            },
            color: 'text.body',
            flexGrow: 1,
            textAlign: 'left',
            fontFamily: 'Inter',
          },

          '& .check': {
            display: 'flex',
            color: 'icon.action',

            '&:not(.selected)': {
              opacity: 0,
            },
          },

          '&:hover': {
            bgcolor: 'surface.actionHover4',

            '& .label': {
              color: 'text.actionHover2',
            },

            '& .icon': {
              color: 'icon.action',
            },
          },

          '&.selected': {
            bgcolor: 'surface.focus2',

            '& .label': {
              color: 'text.action',
            },
          },

          '&.Mui-disabled, &:disabled': {
            cursor: 'default',

            '& .label': {
              color: 'text.disabled',
            },
          },

          '& svg': {
            width: `${theme.scale[500]}px`,
            height: `${theme.scale[500]}px`,
            strokeWidth: 2,
          },
        },

        '& .divider': {
          bgcolor: 'border.primary',
          marginRight: `${theme.scale[550]}px`,
        },

        '& .section': {
          padding: `${theme.scale[100]}px ${theme.scale[200]}px`,
          color: 'text.body',
          fontWeight: {
            xs: theme.typography.fontWeightMedium,
            sm: theme.typography.fontWeightMedium,
            md: theme.typography.fontWeightMedium,
          },
          fontSize: {
            xs: theme.fontSize.body.caption.mobile,
            sm: theme.fontSize.body.caption.tablet,
            md: theme.fontSize.body.caption.desktop,
          },
          lineHeight: {
            xs: theme.lineHeight.body.caption.mobile,
            sm: theme.lineHeight.body.caption.tablet,
            md: theme.lineHeight.body.caption.desktop,
          },
        },
      },

      '& .header-usergroup-option-label': {
        minWidth: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      },

      '& .header-usergroup-empty': {
        color: 'text.disabled',
        padding: `${theme.scale[150]}px ${theme.scale[200]}px`,
      },
    },
  }

  return {
    ...button,
    ...menu,
  }
}
