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
 * @param {string} root0.status - Status indicator
 * @returns {object} - OtpInput styles
 */
export const getStyles = ({ theme, status }) => {
  const borderColors = {
    default: theme.palette.border.primary,
    disabled: theme.palette.border.disabled,
    error: theme.palette.border.primary,
  }
  const borderColor = borderColors[status] ?? borderColors.default

  const root = {
    gap: theme.spacing(1),
  }

  const inputWrapper = {
    '.input-wrapper': {
      display: 'flex',
      width: 'fit-content',

      '.input': {
        ...theme.typography.subtitle2,
        width: `${theme.scale[800]}px`,
        height: `${theme.scale[800]}px`,
        outline: 'none',
        color: 'text.body',
        textAlign: 'center',
        bgcolor: 'surface.primary',
        border: `${theme.borderWidth.sm}px solid ${borderColor}`,

        '&:not(:first-of-type)': {
          marginLeft: `-${theme.borderWidth.sm}px`,
        },

        '&:first-of-type': {
          borderTopLeftRadius: `${theme.borderRadius.xlg}px`,
          borderBottomLeftRadius: `${theme.borderRadius.xlg}px`,
        },

        '&:last-of-type': {
          borderTopRightRadius: `${theme.borderRadius.xlg}px`,
          borderBottomRightRadius: `${theme.borderRadius.xlg}px`,
        },

        '&:focus': {
          position: 'relative',
          zIndex: 1,
          outline: `${theme.borderWidth.md}px solid ${theme.palette.primary.main}`,
          outlineOffset: `${theme.scale[50]}px`,
        },

        '&:disabled': {
          color: 'text.onDisabled',
          cursor: 'not-allowed',
        },
      },
    },
  }

  const text = {
    '.text': {
      color: 'text.headings',

      '&.disabled, &.hint': {
        color: 'text.onDisabled',
      },

      '&.error': {
        color: 'text.error',
      },
    },
  }

  return {
    ...root,
    ...inputWrapper,
    ...text,
  }
}
