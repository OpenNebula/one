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
 * @returns {object} - Pagination SX styles
 */
export const getStyles = ({ theme }) => {
  const baseStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: `${theme.scale[500]}px`,
  }

  const indexContainer = {
    '& .pagination-index-container': {
      display: 'flex',
      alignItems: 'center',
      gap: `${theme.scale[100]}px`,
      alignSelf: 'stretch',
      flex: '1 0 0',
    },
  }

  const sizeContainer = {
    '& .pagination-size-container': {
      display: 'flex',
      alignItems: 'center',
      gap: `${theme.scale[200]}px`,
      height: '40px',
    },

    '& .page-size-title': {
      color: 'text.action',
      textAlign: 'center',

      fontFamily: 'Inter',

      fontSize: {
        xs: theme.fontSize.body.sm.mobile,
        sm: theme.fontSize.body.sm.tablet,
        md: theme.fontSize.body.sm.desktop,
      },
      fontStyle: 'normal',
      fontWeight: 500,

      lineHeight: {
        xs: theme.lineHeight.body.sm.mobile,
        sm: theme.lineHeight.body.sm.tablet,
        md: theme.lineHeight.body.sm.desktop,
      },
    },

    '& .dropdown': {
      width: '108px',
      alignItems: 'flex-start',
    },
  }

  return {
    ...baseStyle,
    ...indexContainer,
    ...sizeContainer,
  }
}
