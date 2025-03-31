/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
/* eslint-disable jsdoc/require-jsdoc */
import { css } from '@emotion/css'
import { STYLE_BUTTONS } from '@ConstantsModule'

// Style to use when render a button
export const SubmitButtonStyles = ({
  theme: { palette } = {},
  importance = STYLE_BUTTONS.IMPORTANCE.SECONDARY,
  icon,
  endIcon,
  label,
  type = icon && !endIcon && !label
    ? STYLE_BUTTONS.TYPE.NOBORDER
    : STYLE_BUTTONS.TYPE.OUTLINED,
  size = STYLE_BUTTONS.SIZE.MEDIUM,
  noborder = false,
  active = false,
}) => {
  const layoutButton = {}

  const onlyIcon = icon && !endIcon && !label

  // Only icon
  if (onlyIcon) {
    layoutButton.padding =
      size === STYLE_BUTTONS.SIZE.LARGE
        ? '1.125rem 2.25rem 1.125rem 2.25rem'
        : '0.5625rem 0.5625rem 0.5625rem 0.5625rem'
  }
  // Icon plus end icon (when you have options)
  else if (icon && endIcon && !label) {
    layoutButton.padding =
      size === STYLE_BUTTONS.SIZE.LARGE
        ? '1.125rem 2.25rem 1.125rem 2.25rem'
        : '0.625rem 0.875rem 0.625rem 0.875rem'
    layoutButton.fontSize =
      size === STYLE_BUTTONS.SIZE.LARGE ? '1.125rem' : '1rem'
    layoutButton.fontStyle = 'normal'
    layoutButton.fontWeight = '500'
  }
  // Only label
  else if (label && !icon && !endIcon) {
    layoutButton.padding =
      size === STYLE_BUTTONS.SIZE.LARGE
        ? '1.125rem 2.25rem 1.125rem 2.25rem'
        : '0.5625rem 1.5rem 0.5625rem 1.5rem'
    layoutButton.fontSize =
      size === STYLE_BUTTONS.SIZE.LARGE ? '1.125rem' : '1rem'
    layoutButton.fontStyle = 'normal'
    layoutButton.fontWeight = '500'
    layoutButton.textAlign = 'center'
    layoutButton.lineHeight = '1.25rem'
  }
  // Label with end icon (when you have options)
  else if (label && !icon && endIcon) {
    layoutButton.padding =
      size === STYLE_BUTTONS.SIZE.LARGE
        ? '1.125rem 2.25rem 1.125rem 7.75rem'
        : '0.5625rem 1.5rem 0.5625rem 1rem'
    layoutButton.fontSize =
      size === STYLE_BUTTONS.SIZE.LARGE ? '1.125rem' : '1rem'
    layoutButton.fontStyle = 'normal'
    layoutButton.fontWeight = '500'
    layoutButton.textAlign = 'center'
    layoutButton.lineHeight = '1.25rem'
  }
  // Label with icon
  else if (label && icon && !endIcon) {
    layoutButton.padding =
      size === STYLE_BUTTONS.SIZE.LARGE
        ? '1.125rem 2.25rem 1.125rem 7.75rem'
        : '0.5625rem 1.5rem 0.5625rem 1rem'
    layoutButton.fontSize =
      size === STYLE_BUTTONS.SIZE.LARGE ? '1.125rem' : '1rem'
    layoutButton.fontStyle = 'normal'
    layoutButton.fontWeight = '500'
    layoutButton.textAlign = 'center'
    layoutButton.lineHeight = '1.25rem'
    layoutButton.alignItems = 'center'
    layoutButton.justifyContent = 'center'
  } else if (label && icon && endIcon) {
    layoutButton.padding =
      size === STYLE_BUTTONS.SIZE.LARGE
        ? '1.125rem 2.25rem 1.125rem 7.75rem'
        : '0.5625rem 1.5rem 0.5625rem 1rem'
    layoutButton.fontSize =
      size === STYLE_BUTTONS.SIZE.LARGE ? '1.125rem' : '1rem'
    layoutButton.fontStyle = 'normal'
    layoutButton.fontWeight = '500'
    layoutButton.textAlign = 'center'
    layoutButton.lineHeight = '1.25rem'
    layoutButton.alignItems = 'center'
    layoutButton.justifyContent = 'center'
  }

  return {
    button: css({
      ...palette?.buttons?.[importance]?.[type]?.[active ? 'active' : 'normal'],
      '&:hover': {
        ...palette?.buttons?.[importance]?.[type]?.hover,
        boxShadow: 'none',
      },
      '&:focus': {
        ...palette?.buttons?.[importance]?.[type]?.focus,
      },
      '&:active': {
        ...palette?.buttons?.[importance]?.[type]?.active,
      },
      '&.Mui-disabled, &:disabled': {
        ...palette?.buttons?.[importance]?.[type]?.disabled,
      },
      ...layoutButton,
      ...((onlyIcon && type === STYLE_BUTTONS.TYPE.NOBORDER) || noborder
        ? { borderStyle: 'none' }
        : { borderStyle: 'solid' }),
      borderWidth: '0.0625rem',
      borderRadius: '100rem',
      boxShadow: 'none',
    }),
    icon: css({
      '& svg': {
        height: '1.25rem',
        width: '1.25rem',
      },
    }),
    iconWithOptions: css({
      '& svg': {
        height: '1.125rem',
        width: '1.125rem',
      },
    }),
    tooltipLink: css({
      color: palette?.primary.main,
      textDecoration: 'none',
      '&:hover': {
        color: palette?.primary.dark,
      },
    }),
  }
}
