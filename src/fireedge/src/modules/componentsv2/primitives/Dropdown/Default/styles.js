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
 * @param {boolean} root0.isOpen - Is menu open
 * @param {object} root0.menuHeight - Min/max menu height constraints
 * @param {boolean} root0.hasTitle - Menu title placeholder
 * @returns {object} - Dropdown styles
 */
export const getInputStyles = ({ theme, isOpen, menuHeight, hasTitle }) => {
  const menuDimensions = () => {
    const menuOffset =
      theme.scale[100] + (hasTitle ? theme.scale[200] + theme.scale[300] : 0)
    const { min = 0, max = 0 } = menuHeight

    return {
      maxHeight: `${max + menuOffset}px`,
      minHeight: `${min + menuOffset}px`, // Ensures dropdown can fully display at least 1 option
    }
  }

  const baseStyles = {
    height: '100%',
    width: '100%',
    minWidth: 0,
    display: 'flex',
    flex: '1 0 0',

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

  const dropDown = {
    '& .dropdown': {
      fontStyle: 'normal',
      fontFamily: 'Inter',

      display: 'flex',
      flex: '1 0 0',
      alignItems: 'center',
      gap: `${theme.scale[200]}px`,
      alignSelf: 'stretch',
    },
    '&.dropdown + .MuiAutocomplete-popper': {
      marginTop: '4px',
    },
  }

  const menuContainer = {
    // root
    '& .dropdown-menu-root': {
      // paper container
      '& .dropdown-menu-container': {
        // layout
        display: 'flex',
        padding: `${theme.scale[100]}px ${theme.scale[100]}px`,
        alignItems: 'flex-start',
        alignSelf: 'stretch',
        // style

        borderRadius: `${theme.borderRadius.xlg}px`,
        border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
        bgcolor: 'surface.primary',
        boxShadow:
          '0 4px 10px -4px rgba(0, 0, 0, 0.09), 0 2px 4px -16px rgba(0, 0, 0, 0.10)',
      },
      '& .dropdown-menu-list': {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        flex: '1 0 0',
        ...menuDimensions(),
      },
    },
  }

  const menuItem = {
    '& .dropdown-menu-item': {
      // layout
      display: 'flex',
      padding: `${theme.scale[150]}px ${theme.scale[200]}px`,
      alignItems: 'center',
      alignSelf: 'stretch',
      gap: `${theme.scale[200]}px`,
      // style
      borderRadius: `${theme.borderRadius.xlg}px`,
      bgcolor: 'surface.primary',
      color: 'text.body',
      '&:hover': {
        color: 'text.actionHover2',
        bgcolor: 'surface.actionHover4',
      },

      '& .dropdown-menuitem-text': {
        display: 'flex',
        alignItems: 'flex-start',
        flexDirection: 'column',
        alignSelf: 'stretch',
        gap: `${theme.scale[100]}px`,
        flex: '1 0 0',
      },

      '& .dropdown-menuitem-endicon': {
        marginLeft: 'auto', // always push to end
      },
    },
  }

  const overrides = {
    // input focus
    ...(isOpen && {
      '& .dropdown-input-wrapper': {
        '&:focus-within': {
          outline: 'none !important',
          bgcolor: 'surface.primary',
        },
      },
    }),

    '& .dropdown-input-wrapper': {
      minWidth: 0,
      height: '100%',

      '& .textfield-input-wrapper ': {
        padding: `${theme.scale[300]}px ${theme.scale[400]}px`,
        display: 'flex',
        alignItems: 'center',
        alignSelf: 'stretch',
        gap: `${theme.scale[200]}px`,
        cursor: 'pointer',

        '& .textfield-adornment-start, .textfield-adornment-end': {
          padding: 0,
        },
      },
    },

    '& .MuiInput-input:focus': {
      bgcolor: 'surface.primary',
      borderRadius: `${theme.borderRadius.xlg}px`,
    },

    '& .MuiInput-root.MuiInputBase-sizeSmall .MuiInput-input': {
      padding: 0,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      gap: `${theme.scale[100]}px`,
      flex: '1 0 0',
    },
    '& .input.MuiInput-input': {
      padding: 0,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      gap: `${theme.scale[100]}px`,
      flex: '1 0 0',
      cursor: 'pointer',
    },

    '& .MuiFormControl-root.MuiTextField-root': {
      margin: 0,
    },

    '& .MuiInput-root': {
      paddingBottom: 0,
    },
  }

  const disabled = {
    '&.Mui-disabled': {
      cursor: 'not-allowed',
      pointerEvents: 'none',
    },
  }

  return {
    ...baseStyles,
    ...dropDown,
    ...menuContainer,
    ...menuItem,
    ...disabled,
    ...overrides,
  }
}

/**
 * @param {object} root0 - Params
 * @param {object} root0.theme - Current theme in use
 * @returns {object} - Dropdown styles
 */
export const getMenuStyles = ({ theme }) => {
  const baseStyles = {
    display: 'flex',
    padding: `${theme.scale[100]}px ${theme.scale[100]}px`,
    alignItems: 'flex-start',
    alignSelf: 'stretch',

    borderRadius: `${theme.borderRadius.xlg}px`,
    border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
    bgcolor: 'surface.primary',
    boxShadow:
      '0 4px 10px -4px rgba(0, 0, 0, 0.09), 0 2px 4px -16px rgba(0, 0, 0, 0.10)',
    marginTop: `${theme.scale[100]}px`,

    '& .MuiAutocomplete-noOptions': {
      color: 'text.body',
    },
  }

  return {
    ...baseStyles,
  }
}

/**
 * @param {object} root0 - Params
 * @param {object} root0.theme - Current theme in use
 * @param {number} root0.rowsDisplayed - Number of rows to display
 * @returns {object} - Dropdown styles
 */
export const getListStyles = ({ theme, rowsDisplayed }) => {
  const baseStyles = {
    width: '100%',
    maxHeight: `${rowsDisplayed * 36}px`,
  }

  const menuTitle = {
    '& .dropdown-menutitle-text': {
      display: 'flex',
      padding: `${theme.scale[150]}px ${theme.scale[200]}px ${theme.scale[150]}px ${theme.scale[300]}px`,
      alignItems: 'center',
      alignSelf: 'stretch',
      gap: `${theme.scale[200]}px`,
      flex: '1 0 0',
      position: 'relative',

      borderRadius: `${theme.borderRadius.xlg}px`,
      bgcolor: 'surface.primary',
      color: 'text.headings',
      fontStyle: 'normal',
      fontWeight: 600,
      lineHeight: {
        xs: theme.lineHeight.body.sm.mobile,
        sm: theme.lineHeight.body.sm.tablet,
        md: theme.lineHeight.body.sm.desktop,
      },
    },

    '& .dropdown-menutitle-divider': {
      bgcolor: 'border.primary',
      width: '100%',
      height: '1px',
      marginTop: `${theme.scale[50]}px`,
      marginBottom: `${theme.scale[50]}px`,
    },
  }

  const menuList = {
    '& .dropdown-options-list': {
      padding: 0,
    },
    '& .dropdown-menu-option': {
      display: 'flex',
      padding: `${theme.scale[150]}px ${theme.scale[200]}px`,
      alignItems: 'center',
      gap: `${theme.scale[200]}px`,
      alignSelf: 'stretch',

      borderRadius: `${theme.borderRadius.xlg}px`,
      bgcolor: 'surface.primary',
      color: 'text.body',

      '&:hover': {
        bgcolor: 'surface.actionHover4',
        color: 'text.actionHover2',
      },

      '&[aria-selected="true"]': {
        bgcolor: 'surface.focus2',
        color: 'text.action',
      },

      '&[aria-selected="true"].Mui-focused': {
        bgcolor: 'surface.focus2',
        color: 'text.action',
      },

      '&[aria-selected="true"]:hover': {
        bgcolor: 'icon.actionHover',
        color: 'text.onAction3',

        '& .dropdown-option-text': {
          color: 'text.onAction3',
        },

        '& .dropdown-option-starticon, & .dropdown-option-endicon': {
          color: 'text.onAction3',
        },

        '& svg': {
          color: 'text.onAction3',
        },
      },

      '& .dropdown-option-text': {
        display: 'flex',
        flex: 1,
      },

      '& .dropdown-option-starticon, & .dropdown-option-endicon': {
        display: 'flex',
        flexShrink: 0,
      },
    },
  }

  return {
    ...baseStyles,
    ...menuTitle,
    ...menuList,
  }
}
