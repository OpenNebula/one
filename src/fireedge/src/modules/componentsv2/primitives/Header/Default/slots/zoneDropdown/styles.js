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
    '& .header-zone-button': {
      display: 'flex',
      padding: `${theme.scale[300]}px ${theme.scale[400]}px`,
      gap: `${theme.scale[200]}px`,

      '& .status-dot': {
        display: 'inline-block',
        flexShrink: 0,
        width: `${theme.scale[200]}px`,
        height: `${theme.scale[200]}px`,
        borderRadius: '50%',

        '&.enabled': {
          bgcolor: 'icon.success',
        },

        '&.disabled': {
          bgcolor: 'icon.disabled',
        },
      },

      '& .MuiButton-startIcon svg, & .MuiButton-endIcon svg': {
        width: `${theme.scale[500]}px`,
        height: `${theme.scale[500]}px`,
        strokeWidth: 2,
        color: 'icon.primary',
      },

      '& .MuiButton-startIcon': {
        width: `${theme.scale[200]}px`,
        height: `${theme.scale[200]}px`,
        margin: 0,
        padding: 0,
      },

      '& .label': {
        fontWeight: {
          xs: theme.fontWeight.body.sm.mobile,
          sm: theme.fontWeight.body.sm.tablet,
          md: theme.fontWeight.body.sm.desktop,
        },
        color: 'text.disabled',
      },

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
    },
  }

  const menu = {
    '& .header-zone-menu': {
      display: 'flex',
      flexDirection: 'column',
      padding: `${theme.scale[100]}px`,
      borderRadius: `${theme.borderRadius.xlg}px`,
      border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
      bgcolor: 'surface.primary',
      boxShadow: [
        [
          `0 ${theme.scale[100]}px`,
          `${theme.scale[300]}px`,
          `-${theme.scale[100]}px`,
          'rgba(0, 0, 0, 0.09)',
        ].join(' '),
        [
          `0 ${theme.scale[50]}px`,
          `${theme.scale[100]}px`,
          `-${theme.scale[500]}px`,
          'rgba(0, 0, 0, 0.10)',
        ].join(' '),
      ].join(', '),

      '& .zone-title': {
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

      '& .divider': {
        bgcolor: 'border.primary',
      },

      '& .zone-options': {
        display: 'flex',
        flexDirection: 'column',
        maxHeight: `${theme.scale[1800] - theme.scale[800]}px`,
        overflowY: 'auto',
        marginTop: `${theme.scale[50]}px`,

        '& .zone-option': {
          display: 'flex',
          alignItems: 'center',
          columnGap: `${theme.scale[200]}px`,
          padding: `${theme.scale[150]}px ${theme.scale[200]}px ${theme.scale[150]}px ${theme.scale[300]}px`,
          border: 0,
          bgcolor: 'transparent',
          borderRadius: `${theme.borderRadius.xlg}px`,
          color: 'text.body',
          cursor: 'pointer',
          textAlign: 'left',
          font: 'inherit',

          '& .status-dot': {
            display: 'inline-block',
            flexShrink: 0,
            width: `${theme.scale[200]}px`,
            height: `${theme.scale[200]}px`,
            borderRadius: '50%',

            '&.enabled': {
              bgcolor: 'icon.success',
            },

            '&.disabled': {
              bgcolor: 'icon.disabled',
            },
          },

          '& .copy': {
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: `${theme.scale[100]}px`,
            flexGrow: 1,

            '& .name': {
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: 'text.body',
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
            },
          },

          '&:hover': {
            bgcolor: 'surface.actionHover4',

            '& .copy .name': {
              color: 'text.actionHover2',
            },
          },

          '&.selected': {
            bgcolor: 'surface.focus2',

            '& .copy .name': {
              color: 'text.action',
            },
          },

          '&.Mui-disabled, &:disabled': {
            cursor: 'default',

            '& .copy .name': {
              color: 'text.disabled',
            },
          },
        },

        '& .zone-empty': {
          color: 'text.disabled',
          padding: `${theme.scale[150]}px ${theme.scale[200]}px`,
        },
      },
    },
  }

  return {
    ...button,
    ...menu,
  }
}
