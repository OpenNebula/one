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
 * @param {object} root0.theme - Current theme
 * @returns {object} - Slot styles
 */
export const getStyles = ({ theme }) => {
  const baseStyles = {
    display: 'flex',
    flex: '1 0 0',

    '& .create-button': {
      padding: `${theme.scale[200]}px ${theme.scale[500]}px`,
      fontWeight: {
        xs: theme.typography.fontWeightMedium,
        sm: theme.typography.fontWeightMedium,
        md: theme.typography.fontWeightMedium,
      },
      fontSize: {
        xs: theme.fontSize.body.md.mobile,
        sm: theme.fontSize.body.md.tablet,
        md: theme.fontSize.body.md.desktop,
      },
      lineHeight: {
        xs: theme.lineHeight.body.md.mobile,
        sm: theme.lineHeight.body.md.tablet,
        md: theme.lineHeight.body.md.desktop,
      },

      '& .MuiButton-startIcon': {
        margin: 0,
        width: `${theme.scale[600]}px`,
        height: `${theme.scale[600]}px`,

        '& svg': {
          width: `${theme.scale[600]}px`,
          height: `${theme.scale[600]}px`,
          strokeWidth: 1.5,
        },
      },
    },
  }

  return {
    ...baseStyles,
  }
}
