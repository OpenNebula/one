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
 * @param {boolean} root0.isOutlined - Add outline border
 * @returns {object} - Toggle button SX style
 */
export const getStyles = ({ theme, isOutlined }) => {
  const baseStyle = {
    '--compact-toolbar-divider-space': `${
      theme.borderWidth.sm + theme.scale[100] * 2
    }px`,
    display: 'flex',
    flexWrap: 'nowrap',
    padding: 0,
    justifyContent: 'center',
    alignItems: 'flex-start',
    flex: '1 0 0',
    alignSelf: 'stretch',
    whiteSpace: 'nowrap',
    overflow: 'hidden',

    borderRadius: `${theme.scale[150]}px`,
    bgcolor: 'surface.primary',

    ...(isOutlined && {
      border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
    }),

    fontWeight: {
      xs: theme.fontWeight.body.sm.mobile,
      sm: theme.fontWeight.body.sm.tablet,
      md: theme.fontWeight.body.sm.desktop,
    },

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
  const divider = {
    '& .toggle-group-section': {
      display: 'flex',
      flexWrap: 'nowrap',
      alignSelf: 'stretch',
    },

    '& .toggle-group-divider': {
      margin: `${theme.scale[100]}px`,
    },
  }
  const toggle = {
    '& .toggle-button-container': {
      borderRadius: 0,
    },
  }

  return {
    ...baseStyle,
    ...divider,
    ...toggle,
  }
}
