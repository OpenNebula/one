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
 * @returns {object} - Button SX style
 */
export const getStyles = ({ theme }) => {
  const icon = {
    color: theme.palette.icon.primary,

    '& svg': {
      width: `${theme.scale[600]}px`,
      height: `${theme.scale[600]}px`,
      strokeWidth: 1.5,
    },

    '&.big svg': {
      width: `${theme.scale[800]}px`,
      height: `${theme.scale[800]}px`,
    },
  }

  const text = {
    textAlign: 'center',
    color: theme.palette.text.body,
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
  }

  return {
    cursor: 'pointer',
    display: 'flex',
    minWidth: `${theme.scale[1500]}px`,
    flexDirection: 'column',
    alignItems: 'center',
    gap: `${theme.scale[200]}px`,
    padding: `${theme.scale[150]}px ${theme.scale[400]}px`,
    borderRadius: `${theme.borderRadius.xlg}px`,
    border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
    backgroundColor: theme.palette.surface.primary,

    '& .card-button-icon': icon,
    '& .card-button-text': text,

    '&:hover': {
      backgroundColor: theme.palette.surface.actionHover4,
    },

    '&.disabled': {
      backgroundColor: theme.palette.surface.actionHover4,

      '& .card-button-icon': {
        color: theme.palette.icon.onDisabled,
      },

      '& .card-button-text': {
        color: theme.palette.text.onDisabled,
      },
    },

    '&:active': {
      backgroundColor: theme.palette.surface.primary,
      outlineOffset: `${theme.borderWidth.sm}px`,
      outline: `${theme.borderWidth.sm}px solid ${theme.palette.border.focus2}`,
    },

    '&.selected': {
      padding: `${theme.scale[150] - 1}px ${theme.scale[400] - 1}px`,
      border: `${theme.borderWidth.md}px solid ${theme.palette.border.focus2}`,
    },
  }
}
