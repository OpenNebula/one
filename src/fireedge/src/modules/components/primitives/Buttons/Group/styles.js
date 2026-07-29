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
 * @returns {object} - ButtonGroup SX style
 */
export const getStyles = ({ theme }) => {
  const baseStyle = {
    display: 'flex',
    alignItems: 'center',
    alignSelf: 'stretch',

    border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
    borderRadius: `${theme.borderRadius.xlg}px`,

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
  }

  const borderRadiusWidth = theme.borderRadius.xlg - theme.borderWidth.sm

  const buttonContainer = {
    '& .button-container': {
      minHeight: '32px',
      display: 'flex',
      flexWrap: 'nowrap',
      alignItems: 'center',
      alignSelf: 'stretch',
      whiteSpace: 'nowrap',
      '&:not(:last-of-type)': {
        borderRight: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
      },
      '&:first-of-type': {
        borderRadius: `${borderRadiusWidth}px 0 0 ${borderRadiusWidth}px`,
        overflow: 'hidden',
      },
      '&:last-of-type': {
        borderRadius: `0 ${borderRadiusWidth}px ${borderRadiusWidth}px 0`,
        overflow: 'hidden',
      },
      '&:hover': {
        cursor: 'pointer',
        bgcolor: 'surface.actionHover4',
        '&:not(:last-of-type)': {
          borderRight: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
        },
        '> *': {
          color: 'text.actionHover2',
        },
      },

      '&.selected': {
        bgcolor: 'surface.focus',

        '> *': {
          color: 'text.selected',
        },

        '& .buttongroup-button-icon': {
          color: 'icon.selected',
        },
      },

      '&.selected:hover': {
        bgcolor: 'surface.action',

        '> *': {
          color: 'text.onAction',
        },
      },

      '&.disabled': {
        opacity: 0.4,
        bgcolor: 'surface.disabled',
        cursor: 'not-allowed',
        pointerEvents: 'none',
        '> *': {
          color: 'text.onDisabled',
        },
        '& .buttongroup-button-icon': {
          color: 'icon.onDisabled',
        },
      },

      '> *': {
        display: 'flex',
        flexWrap: 'nowrap',
        justifyContent: 'center',
        alignItems: 'center',
        gap: `${theme.scale[200]}px`,
        color: 'text.action',
        fontStyle: 'normal',
        fontWeight: 500,
        textTransform: 'none',
        border: 0,
        borderRadius: 0,
        padding: `${theme.scale[150]}px ${theme.scale[400]}px`,
      },
    },
  }

  const overrides = {
    '& .MuiButtonGroup-grouped': {
      border: 0,
    },
    '& .MuiButtonGroup-grouped:not(:first-of-type)': {
      marginLeft: 0,
    },
    '& .MuiButtonGroup-root .MuiButtonGroup-grouped:not(:first-of-type)': {
      margin: 0,
    },

    '& .MuiButton-root': {
      transition: 'none',
      whiteSpace: 'nowrap',
      '&:hover': {
        border: 0,
        bgcolor: 'transparent',
      },
    },

    '& .MuiButton-root.Mui-disabled': {
      bgcolor: 'surface.disabled',
      color: 'text.onDisabled',
      border: 0,
    },
  }

  return {
    ...baseStyle,
    ...buttonContainer,
    ...overrides,
  }
}
