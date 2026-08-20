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
  const captionTypography = {
    color: 'text.body',
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: 500,

    fontSize: {
      xs: theme.fontSize.body.caption.mobile,
      sm: theme.fontSize.body.caption.tablet,
      md: theme.fontSize.body.caption.desktop,
    },
    lineHeight: {
      xs: theme.lineHeight.body.caption.mobile,
      sm: theme.lineHeight.body.caption.tablet,
      md: theme.lineHeight.body.caption.desktop,
    },
  }

  const baseStyles = {
    display: 'inline-flex',
    flexWrap: 'wrap',
    gap: `${theme.scale[100]}px`,
    alignItems: 'flex-start',
    maxWidth: '100%',
  }

  const label = {
    '& .region-label': {
      display: 'inline-flex',
      flexShrink: 0,
      gap: `${theme.scale[50]}px`,
      maxWidth: '100%',
      '&::before': {
        content: '"\\2022"',
        marginRight: `${theme.scale[50]}px`,
        ...captionTypography,
      },
      '&:first-of-type::before': {
        display: 'none',
      },
      '& .region-label--title, & .region-label--value': {
        ...captionTypography,
      },

      '& .region-label--title': {
        '&:not(:only-child)::after': {
          content: '":"',
        },
      },
    },
  }

  return {
    ...baseStyles,
    ...label,
  }
}
