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
 * @returns {object} - Datepicker styles
 */
export const getStyles = ({ theme }) => {
  const baseStyles = {
    width: '242px',
    position: 'relative',

    '& .datepicker-wrapper': {
      width: '100%',
      display: 'flex',
    },

    '& .react-datepicker__input-container': {
      width: '100%',
    },
  }

  const label = {
    color: 'text.headings',
    position: 'initial',
    overflow: 'initial',
    padding: 0,
    transform: 'initial',
    transformOrigin: 'initial',
    fontSize: {
      xs: theme.fontSize.body.sm.mobile,
      sm: theme.fontSize.body.sm.tablet,
      md: theme.fontSize.body.sm.desktop,
    },
    fontWeight: {
      xs: 500,
      sm: 500,
      md: 500,
    },
    lineHeight: {
      xs: theme.lineHeight.body.sm.mobile,
      sm: theme.lineHeight.body.sm.tablet,
      md: theme.lineHeight.body.sm.desktop,
    },
  }

  const input = {
    margin: 0,
    width: '100%',
    boxSizing: 'border-box',
    overflow: 'hidden',
    borderRadius: `${theme.borderRadius.xlg}px`,
    backgroundColor: 'surface.primary',
    border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,

    '&:hover': {
      borderColor: theme.palette.border.actionHover,
    },

    '.MuiInput-input': {
      height: 'initial',
      flex: '1 1 auto',
      width: 'auto',
      minWidth: 0,
      boxSizing: 'border-box',
      padding: `${theme.scale[300]}px ${theme.scale[400]}px`,
      color: 'text.body',
      borderRight: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
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
    },

    '.datepicker-input-endadornment': {
      display: 'flex',
      flex: `0 0 ${theme.spacing(5)}`,
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      bgcolor: 'surface.action',
      boxSizing: 'border-box',
      padding: `${theme.scale[300]}px ${theme.scale[400]}px`,

      '& svg': {
        padding: '2px 0',
        color: theme.palette.icon.onAction,
        width: `${theme.scale[500]}px`,
        height: `${theme.scale[500]}px`,
        strokeWidth: 2,
        boxSizing: 'initial',
      },
    },
  }

  const inputContainer = {
    '& .datepicker-input': {
      width: '100%',

      '.MuiFormControl-root': {
        margin: 0,
        width: '100%',
        display: 'flex',
        gap: `${theme.scale[100]}px`,
        flexDirection: 'column',

        '.MuiInputLabel-root': {
          ...label,
        },

        '.MuiInput-root': {
          ...input,
        },
      },
    },
  }

  const calendarHeader = {
    padding: 0,
    border: 'none',
    display: 'flex',
    flexDirection: 'column',
    bgcolor: theme.palette.surface.primary,

    '& .datepicker-header': {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',

      '& .month-year-display': {
        color: 'text.action',
        fontSize: {
          xs: theme.fontSize.body.sm.mobile,
          sm: theme.fontSize.body.sm.tablet,
          md: theme.fontSize.body.sm.desktop,
        },
        fontWeight: {
          xs: theme.fontWeight.heading.h5.mobile,
          sm: theme.fontWeight.heading.h5.tablet,
          md: theme.fontWeight.heading.h5.desktop,
        },
        lineHeight: {
          xs: theme.lineHeight.body.sm.mobile,
          sm: theme.lineHeight.body.sm.tablet,
          md: theme.lineHeight.body.sm.desktop,
        },
      },

      '& .date-range-buttons': {
        display: 'flex',
        alignItems: 'center',
        gap: `${theme.scale[100]}px`,

        '& button': {
          padding: 0,
          border: 'none',

          '& svg': {
            bgcolor: theme.palette.surface.primary,
          },
        },
      },
    },

    '& .react-datepicker__day-names': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: `${theme.scale[200]}px`,
      margin: '15px 0',

      '& .react-datepicker__day-name': {
        margin: 0,
        width: '24px',
        height: '24px',
        color: 'text.body',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: {
          xs: theme.fontSize.body.sm.mobile,
          sm: theme.fontSize.body.sm.tablet,
          md: theme.fontSize.body.sm.desktop,
        },
        fontWeight: {
          xs: 500,
          sm: 500,
          md: 500,
        },
        lineHeight: {
          xs: theme.lineHeight.body.sm.mobile,
          sm: theme.lineHeight.body.sm.tablet,
          md: theme.lineHeight.body.sm.desktop,
        },
      },
    },
  }

  const calendarDay = {
    color: 'text.body',
    margin: 0,
    width: '24px',
    height: '24px',
    borderRadius: `${theme.borderRadius.xlg}px`,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    bgcolor: theme.palette.surface.primary,
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

    '&:hover': {
      color: 'text.action',
      border: 'none',
      bgcolor: theme.palette.surface.actionHover4,
    },

    '&:focus': {
      color: 'text.body',
      bgcolor: theme.palette.surface.primary,
      border: `${theme.borderWidth.sm}px solid ${theme.palette.border.focus}`,
    },

    // Selected
    '&.react-datepicker__day--selected': {
      bgcolor: 'surface.action',
      color: 'text.onAction',
      outline: `${theme.borderWidth.sm}px solid ${theme.palette.surface.action}`,
      outlineOffset: '1px',

      '&:hover': {
        color: 'text.onAction2',
        border: 'none',
        bgcolor: theme.palette.surface.actionHover,
        outline: 'none',
      },

      '&:focus': {
        border: `none`,
        bgcolor: theme.palette.surface.action,
        color: 'text.onAction',
        outline: `${theme.borderWidth.sm}px solid ${theme.palette.border.focus}`,
      },
    },

    // Today
    '&.highlight-today': {
      border: `${theme.borderWidth.sm}px solid ${theme.palette.surface.action}`,

      '&.react-datepicker__day--selected': {
        border: `none`,
        outline: `${theme.borderWidth.sm}px solid ${theme.palette.surface.action}`,
        outlineOffset: '1px',

        '&:hover': {
          color: 'text.onAction2',
          border: 'none',
          bgcolor: theme.palette.surface.actionHover,
          outline: 'none',
        },
      },
    },

    // Outside current month
    '&.outside-current-month': {
      pointerEvents: 'none',
      backgroundColor: theme.palette.surface.disabled,
      color: 'text.onDisabled',
    },
  }

  const calendarWeek = {
    display: 'flex',
    alignItems: 'center',
    gap: `${theme.scale[200]}px`,
    justifyContent: 'space-between',

    '& .react-datepicker__day': {
      ...calendarDay,
    },
  }

  const calendarMonth = {
    padding: 0,
    margin: 0,
    border: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: `${theme.scale[200]}px`,

    '& .react-datepicker__week': {
      ...calendarWeek,
    },
  }

  const calendar = {
    display: 'flex',
    flexDirection: 'column',

    '& .react-datepicker__header': {
      ...calendarHeader,
    },

    '& .react-datepicker__month': {
      ...calendarMonth,
    },
  }

  const timePicker = {
    width: `${theme.scale[1500]}px`,
    marginLeft: `${theme.scale[400]}px`,
    boxSizing: 'border-box',
    borderLeft: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
    bgcolor: 'surface.primary',
    fontFamily: 'Inter',

    '& .react-datepicker__header--time': {
      padding: `${theme.scale[200]}px ${theme.scale[300]}px`,
      borderBottom: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
      bgcolor: 'surface.primary',
    },

    '& .react-datepicker-time__header': {
      margin: 0,
      color: 'text.action',
      fontSize: {
        xs: theme.fontSize.body.sm.mobile,
        sm: theme.fontSize.body.sm.tablet,
        md: theme.fontSize.body.sm.desktop,
      },
      fontWeight: {
        xs: theme.fontWeight.heading.h5.mobile,
        sm: theme.fontWeight.heading.h5.tablet,
        md: theme.fontWeight.heading.h5.desktop,
      },
      lineHeight: {
        xs: theme.lineHeight.body.sm.mobile,
        sm: theme.lineHeight.body.sm.tablet,
        md: theme.lineHeight.body.sm.desktop,
      },
    },

    '& .react-datepicker__time': {
      borderRadius: 0,
      bgcolor: 'surface.primary',
    },

    '& .react-datepicker__time .react-datepicker__time-box': {
      width: '100%',
      borderRadius: 0,
      bgcolor: 'surface.primary',
    },

    '& .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list':
      {
        boxSizing: 'border-box',
        scrollbarColor: `${theme.palette.surface.disabled2} transparent`,
        bgcolor: 'surface.primary',
      },

    '& .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list li.react-datepicker__time-list-item':
      {
        height: `${theme.scale[700]}px`,
        padding: `0 ${theme.scale[300]}px`,
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'text.body',
        bgcolor: 'surface.primary',
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

        '&:hover': {
          color: 'text.action',
          bgcolor: 'surface.actionHover4',
        },

        '&.react-datepicker__time-list-item--selected': {
          color: 'text.onAction',
          bgcolor: 'surface.action',
          fontWeight: {
            xs: theme.fontWeight.heading.h5.mobile,
            sm: theme.fontWeight.heading.h5.tablet,
            md: theme.fontWeight.heading.h5.desktop,
          },

          '&:hover': {
            color: 'text.onAction2',
            bgcolor: 'surface.actionHover',
          },
        },

        '&.react-datepicker__time-list-item--disabled': {
          cursor: 'default',
          color: 'text.onDisabled',
          bgcolor: 'surface.disabled',

          '&:hover': {
            color: 'text.onDisabled',
            bgcolor: 'surface.disabled',
          },
        },
      },
  }

  const calendarContainer = {
    '& .react-datepicker-popper': {
      width: '100%',
      marginTop: `-${theme.scale[200]}px`,

      '& .datepicker-calendar': {
        minWidth: '242px',
        width: 'fit-content',
        padding: `${theme.scale[400]}px`,
        bgcolor: 'surface.primary',
        borderRadius: `${theme.borderRadius.xlg}px`,
        border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
        boxShadow:
          '0 4px 10px -4px rgba(0, 0, 0, 0.09), 0 2px 4px -16px rgba(0, 0, 0, 0.10)',

        '& .react-datepicker__month-container': {
          ...calendar,
        },

        '& .react-datepicker__time-container': {
          ...timePicker,
        },
      },
    },
  }

  return {
    ...baseStyles,
    ...inputContainer,
    ...calendarContainer,
  }
}

/**
 * @param {object} root0 - Params
 * @param {object} root0.theme - Current theme in use
 * @param {string} root0.portalId - React datepicker portal id
 * @returns {object} - Datepicker portal styles
 */
export const getPortalStyles = ({ theme, portalId }) => {
  const popperStyles = getStyles({ theme })['& .react-datepicker-popper']

  return {
    [`#${portalId} .react-datepicker-popper`]: {
      ...popperStyles,
      width: 'max-content',
      zIndex: (theme.zIndex?.modal ?? 1300) + 1,
    },
  }
}
