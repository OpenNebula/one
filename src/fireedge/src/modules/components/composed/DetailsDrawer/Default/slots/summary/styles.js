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
    flex: '1 0 0',
    overflow: 'hidden',

    borderBottom: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
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

  const region = {
    '& .region-summary': {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      flex: '1 1 0',
      minWidth: 0,
      padding: `${theme.scale[200]}px ${theme.scale[400]}px`,
      gap: `${theme.scale[100]}px`,

      '&:not(:last-of-type)': {
        borderRight: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
      },
    },

    '& .text-ellipsis': {
      display: 'block',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      maxWidth: '100%',
      color: 'text.headings',
    },
  }

  const title = {
    '& .region-summary--title': {
      alignSelf: 'stretch',

      color: 'text.headings',
      fontFamily: 'Inter',
      fontStyle: 'normal',
      fontWeight: 600,
    },
  }

  const value = {
    '& .region-summary--value': {
      alignSelf: 'stretch',

      color: 'text.body',
      fontFamily: 'Inter',
      fontStyle: 'normal',
      fontWeight: 400,
    },
  }

  return {
    ...baseStyles,
    ...region,
    ...title,
    ...value,
  }
}
