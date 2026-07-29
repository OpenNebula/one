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
 * @param {object} props - Params
 * @param {string} props.type - Button type
 * @param {object} props.theme - Current theme in use
 * @param {boolean} props.iconOnly - Render icon only
 * @returns {object} - Button SX style
 */
export const getStyles = ({ type, theme, iconOnly }) => {
  const baseStyle = {
    // Styles for the line that connects the steps
    '& .MuiStepConnector-line': {
      borderTopWidth: `${theme.scale[25]}px`,
      borderColor: 'border.primary',
    },

    // Distance between step and label
    '& .MuiStepLabel-label.MuiStepLabel-alternativeLabel': {
      marginTop: `${theme.scale[100]}px`,
    },

    // Styles for the step icon
    '& .stepper-icon': {
      width: '24px',
      height: '24px',
      minWidth: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxSizing: 'border-box',
      fontSize: {
        xs: theme.fontSize.body.md.mobile,
        sm: theme.fontSize.body.md.tablet,
        md: theme.fontSize.body.md.desktop,
      },
      lineHeight: {
        xs: theme.lineHeight.body.md.mobile,
        sm: theme.lineHeight.body.md.tablet,
        md: theme.lineHeight.body.md.desktop,
      },
      color: 'text.headings',

      '& svg': {
        width: '16px',
        height: '16px',
      },

      '&.stepper-icon-pending-with-icon, &.stepper-icon-active-with-icon, &.stepper-icon-active, &.stepper-icon-completed, &.stepper-icon-reviewing, &.stepper-icon-hasErrors':
        {
          borderRadius: `${theme.borderRadius.round}px`,
        },

      '&.stepper-icon-pending-with-icon': {
        border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
      },

      '&.stepper-icon-active-with-icon': {
        border: `${theme.borderWidth.sm}px solid ${theme.palette.border.action}`,
      },

      '&.stepper-icon-completed': {
        backgroundColor: 'surface.success',
        color: 'text.success',
      },

      '&.stepper-icon-reviewing': {
        border: `${theme.borderWidth.sm}px solid ${theme.palette.border.warning}`,
      },

      '&.stepper-icon-hasErrors': {
        border: `${theme.borderWidth.sm}px solid ${theme.palette.border.error}`,
      },
    },

    '& .stepper-icon, & .stepper-label-title, & .stepper-label-status, & .stepper-label-step':
      {
        fontStyle: 'normal',
      },

    '& .stepper-icon, & .stepper-label-title, & .stepper-label-status': {
      fontWeight: 500,
    },

    '& .stepper-step-button-clickable': {
      cursor: 'pointer',
    },

    '& .stepper-label-status, & .stepper-label-step': {
      color: 'text.body',
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

    '& .stepper-label-step': {
      color: 'text.onDisabled',
    },

    // Styles for the step label
    '& .stepper-label-title': {
      color: 'text.body',
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

    // Color of the title label
    '& .stepper-label-title-pending': {
      color: 'text.disabled',
    },

    '& .stepper-label-title-completed': {
      color: 'text.onDisabled',
    },

    '& .stepper-label-title-active, & .stepper-label-title-error': {
      color: 'text.headings',
    },

    '& .stepper-label-title-reviewing': {
      color: 'text.warning',
    },

    // Color of the status label
    '& .stepper-label-status-active': {
      color: 'text.action',
    },

    '& .stepper-label-status-completed': {
      color: 'text.success',
    },

    '& .stepper-label-status-reviewing': {
      color: 'text.warning',
    },

    '& .stepper-label-status-error': {
      color: 'text.error',
    },
  }

  return { ...baseStyle }
}
