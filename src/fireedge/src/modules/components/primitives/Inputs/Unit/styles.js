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
 * @returns {object} - Unit input styles
 */
export const getStyles = ({ theme }) => ({
  adornment: {
    margin: 0,
    maxHeight: 'none',
    boxSizing: 'border-box',
    height: '100%',
    display: 'flex',
    padding: 0,
    alignItems: 'center',
    alignSelf: 'stretch',
    borderRadius: `0 ${theme.borderRadius.xlg}px ${theme.borderRadius.xlg}px 0`,
    borderLeft: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
    bgcolor: 'surface.mute',
  },
  select: {
    height: '100%',
    color: 'text.body',
    px: 1.5,
    display: 'flex',
    alignItems: 'center',

    '& .MuiSelect-select': {
      display: 'flex',
      alignItems: 'center',
      py: 0,
      pr: '24px !important',
    },

    '& .MuiSelect-icon': {
      color: 'icon.primary',
    },

    '&.Mui-disabled': {
      color: 'text.onDisabled',

      '& .MuiSelect-icon': {
        color: 'text.onDisabled',
      },
    },
  },
  menuPaper: {
    border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
    bgcolor: 'surface.primary',
    color: 'text.body',
  },
})
