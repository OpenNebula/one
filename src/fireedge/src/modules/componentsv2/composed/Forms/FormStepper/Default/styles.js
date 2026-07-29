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
 * @param {string} root0.type - Button type
 * @param {object} root0.theme - Current theme in use
 * @param {boolean} root0.iconOnly - Render icon only
 * @param {string} root0.size - Size of button
 * @param {boolean} root0.isPopup - Whether the stepper is rendered in a popup
 * @returns {object} - Button SX style
 */
export const getStyles = ({ type, theme, iconOnly, size, isPopup }) => {
  const footerBackgroundColor = theme.palette.surface.page

  const baseStyle = {
    display: 'flex',
    flex: '1 1 auto',
    minHeight: 0,
    flexDirection: 'column',
    width: '1024px',
    maxWidth: '100%',
    padding: `${
      isPopup ? theme.scale[600] : theme.scale[600] - theme.scale[100]
    }px`,
    alignSelf: 'center',
    '@media (max-width: 1199px), (max-height: 799px)': {
      width: '100%',
    },

    '& .form-footer-buttons': {
      position: 'sticky',
      bottom: 0,
      marginTop: 'auto',
      zIndex: 1,
      backgroundColor: footerBackgroundColor,
      boxShadow: `0 100vh 0 100vh ${footerBackgroundColor}`,
    },

    '& .form-help-buttons': {
      display: 'flex',
      justifyContent: 'flex-end',
    },

    '& .form-stepper-buttons': {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: '24px',
      borderTop: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
    },

    '& .form-stepper-buttons-progress': {
      display: 'flex',
      flexDirection: 'row',
      gap: '20px',
    },

    '& .form-stepper-content': {
      marginTop: `${theme.scale[800]}px`,
      paddingBottom: `${theme.scale[600]}px`,
      marginBottom: `${theme.scale[800]}px`,
      color: 'text.body',
    },

    ...(!isPopup && {
      '& .form-stepper-content > *': {
        padding: `${theme.scale[100]}px`,
        boxSizing: 'border-box',
        overflow: 'visible',
      },
    }),

    '& .form-stepper-content > *:has(.MuiTabs-root)': {
      marginTop: '32px',
    },

    '& .form-stepper-content :has(> .MuiTabs-root)': {
      marginBottom: `${theme.scale[800]}px`,
    },
  }

  return { ...baseStyle }
}
