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
 * @returns {object} - Slot styles
 */
export const getStyles = ({ theme }) => {
  const baseStyles = {
    display: 'flex',
    flexDirection: 'column',
    flex: '1 1 0',
    width: '100%',
    minHeight: 0,
    minWidth: 0,
    gap: `${theme.scale[600]}px`,
    overflow: 'hidden',

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

  const content = {
    '& .tab-content': {
      display: 'flex',
      flex: '1 1 0',
      flexDirection: 'column',
      width: '100%',
      minWidth: 0,
      minHeight: 0,
      overflowX: 'hidden',
      overflowY: 'auto',
    },

    '& .tab-content > *': {
      flex: '1 1 0',
      width: '100%',
      minWidth: 0,
      minHeight: 0,
      padding: `${theme.scale[100]}px`,
      boxSizing: 'border-box',
    },
  }

  return {
    ...baseStyles,
    ...content,
  }
}
