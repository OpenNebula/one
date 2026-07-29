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

const getStatusModifiers = ({ theme, status, isFilled }) => {
  const baseSchemes = {
    default: {
      color: 'text.disabled',
      bgcolor: 'surface.primary',
      border: 'primary',
      iconColor: 'surface.mute',
    },
    error: {
      color: 'text.error',
      bgcolor: 'surface.error',
      border: 'error',
      iconColor: 'surface.error',
    },
    success: {
      color: 'text.success',
      bgcolor: 'surface.success',
      border: 'success',
      iconColor: 'surface.success',
    },
    disabled: {
      color: 'text.onDisabled',
      bgcolor: 'surface.disabled',
      border: 'primary',
      iconColor: 'surface.disabled2',
    },
  }

  const { bgcolor, border } = baseSchemes[status] ?? baseSchemes.default

  return {
    border: `${theme.borderWidth.sm}px solid ${theme.palette.border?.[border]}`,
    ...((isFilled || status === 'disabled') && { bgcolor }),
  }
}

/**
 * @param {object} root0 - Params
 * @param {object} root0.theme - Current theme in use
 * @param {boolean} root0.isFilled - Is isFilled
 * @param {boolean} root0.isIconOffset - Extra padding for end/start icons
 * @param {string} root0.status - Status modifier key
 * @returns {object} - TextArea styles
 */
export const getStyles = ({ theme, status, isFilled, isIconOffset }) => {
  const { iconColor, ...statusModifers } = getStatusModifiers({
    theme,
    status,
    isFilled,
  })
  const baseStyles = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: `${theme.scale[100]}px`,
    alignSelf: 'stretch',

    fontStyle: 'normal',
    fontFamily: 'Inter',

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

  const textareaRequiredIcon = {
    '& .textarea-required-svg': {
      width: '4.726px',
      height: '4.909px',
      position: 'absolute',
      left: '-5px',
      top: '0.545px',
      color: 'icon.action',
    },
  }

  const textareaHeader = {
    '& .textarea-header': {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      gap: `${theme.scale[100]}px`,
      alignSelf: 'stretch',

      '& .label': {
        color: 'text.headings',
        fontWeight: {
          xs: 500,
          sm: 500,
          md: 500,
        },
      },

      '& .tooltip': {
        width: '14px',
        height: '14px',
        strokeWidth: 2,
        color: 'icon.information',
      },

      '& .optional': {
        color: 'text.onDisabled',
        fontWeight: {
          xs: 300,
          sm: 300,
          md: 300,
        },
        fontSize: {
          xs: theme.fontSize.body.caption.mobile,
          sm: theme.fontSize.body.caption.tablet,
          md: theme.fontSize.body.caption.desktop,
        },
      },
    },
  }

  const textareaHint = {
    '& .textarea-hint': {
      color: 'text.disabled',
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
      fontSize: {
        xs: theme.fontSize.body.caption.mobile,
        sm: theme.fontSize.body.caption.tablet,
        md: theme.fontSize.body.caption.desktop,
      },
    },
  }

  const textareaContainer = {
    '& .textarea-container': {
      display: 'flex',
      position: 'relative',
      width: '100%',

      '& .start-icon, & .end-icon': {
        width: `${theme.scale[500]}px`,
        height: `${theme.scale[500]}px`,
        position: 'absolute',
        top: `${theme.scale[300]}px`,
        zIndex: 1,
        display: 'flex',
        color: iconColor,
        pointerEvents: 'none',
      },

      '& .start-icon': {
        left: `${theme.scale[400]}px`,
      },

      '& .end-icon': {
        right: `${theme.scale[400]}px`,
      },

      '& .textarea': {
        ...statusModifers,
        color: 'text.body',
        bgcolor: 'surface.primary',
        padding: `${theme.scale[300]}px ${theme.scale[400]}px`,
        borderRadius: `${theme.borderRadius.xlg}px`,
        borderWidth: `${theme.borderWidth.sm}px`,
        borderStyle: 'solid',
        width: '100%',
        resize: 'vertical',
        fontFamily: 'Inter',
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
        fontSize: {
          xs: theme.fontSize.body.sm.mobile,
          sm: theme.fontSize.body.sm.tablet,
          md: theme.fontSize.body.sm.desktop,
        },

        '&::placeholder': {
          color: 'text.disabled',
        },

        '&:focus': {
          outline: `${theme.borderWidth.md}px solid ${theme.palette.border.focus2}`,
          outlineOffset: `${theme.borderWidth.sm}px`,
        },
      },

      '&:has(.start-icon) .textarea': {
        paddingLeft: `${
          theme.scale[400] + theme.scale[500] + theme.scale[200]
        }px`,
      },

      '&:has(.end-icon) .textarea': {
        paddingRight: `${
          theme.scale[400] + theme.scale[500] + theme.scale[200]
        }px`,
      },
    },
  }

  const textareaCharCount = {
    '& .textarea-character-count': {
      color: 'text.disabled',
      fontWeight: {
        xs: 500,
        sm: 500,
        md: 500,
      },
      lineHeight: {
        xs: theme.lineHeight.body.caption.mobile,
        sm: theme.lineHeight.body.caption.tablet,
        md: theme.lineHeight.body.caption.desktop,
      },
      fontSize: {
        xs: theme.fontSize.body.caption.mobile,
        sm: theme.fontSize.body.caption.tablet,
        md: theme.fontSize.body.caption.desktop,
      },
    },
  }

  return {
    ...baseStyles,
    ...textareaHint,
    ...textareaCharCount,
    ...textareaHeader,
    ...textareaContainer,
    ...textareaRequiredIcon,
  }
}
