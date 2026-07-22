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
 * @param {object} root0.dimensions - Size dimensions
 * @param {boolean} root0.hasLabel - Whether the switch renders a text label
 * @returns {object} - Radio button SX style
 */
export const getStyles = ({ theme, dimensions, hasLabel = true }) => {
  const { root, insetV, insetH, checkedTranslateX } = dimensions

  const baseStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: `${theme.scale[200]}px`,

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

  const switchContainer = {
    '& .switch-container': {
      display: 'flex',
      alignItems: 'center',
      gap: hasLabel ? `${theme.scale[200]}px` : 0,
    },
    '& .switch-tooltip': {
      color: 'text.action',
    },
  }

  const switchRoot = {
    '& .switch-root': {
      padding: 0,
      overflow: 'visible',
      ...root,
    },
  }

  const switchBase = {
    '& .switch-base': {
      padding: 0,
      transition: 'none',
      color: 'icon.action',
      top: insetV,
      left: insetH,

      '&:hover': {
        color: 'icon.actionHover',
      },

      '&.Mui-checked': {
        color: 'surface.primary',
        transform: `translateX(${checkedTranslateX})`,
      },
    },
  }

  const switchTrack = {
    '& .switch-track': {
      width: '100%',
      height: '100%',
      borderRadius: `${theme.borderRadius.round}px`,
      opacity: 1,
      bgcolor: 'surface.disabled',
    },
    '& .switch-base:hover + .switch-track': {
      opacity: 1,
      bgcolor: 'surface.actionHover2',
    },
    '& .switch-base.Mui-checked + .switch-track': {
      bgcolor: 'surface.action',
      opacity: 1,
    },
    '& .switch-base.Mui-checked:hover + .switch-track': {
      bgcolor: 'surface.actionHover',
      opacity: 1,
    },
    '& .switch-base.Mui-focusVisible + .switch-track': {
      outline: `${theme.borderWidth.sm}px solid ${theme.palette.border.action}`,
      outlineOffset: '2px',
    },
  }

  const overrides = {
    '& .MuiSwitch-switchBase:hover': {
      bgcolor: 'transparent',
    },
    '& .MuiSwitch-switchBase.Mui-checked:hover': {
      bgcolor: 'transparent',
    },
    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
      opacity: 1,
    },

    '& .MuiFormControlLabel-root': {
      margin: 0,
      '& .MuiFormControlLabel-label': {
        color: 'text.body',
      },
    },
  }

  return {
    ...baseStyle,
    ...switchRoot,
    ...switchContainer,
    ...switchBase,
    ...switchTrack,
    ...overrides,
  }
}
