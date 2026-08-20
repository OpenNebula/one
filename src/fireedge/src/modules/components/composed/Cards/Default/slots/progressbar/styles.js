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
    fontFamily: 'Inter',
    fontStyle: 'normal',
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

  return {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: `${theme.scale[200]}px`,
    minWidth: 0,
    width: '100%',

    '& .progress-region': {
      display: 'flex',
      flexDirection: 'column',
      gap: `${theme.scale[100]}px`,
      minWidth: 0,
      width: '100%',
    },

    '& .progress-region-header': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: `${theme.scale[200]}px`,
      minWidth: 0,
      width: '100%',
    },

    '& .progress-region-title, & .progress-region-value': {
      ...captionTypography,
      minWidth: 0,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },

    '& .progress-region-title': {
      color: 'text.disabled',
      fontWeight: 500,
    },

    '& .progress-region-value': {
      color: 'text.headings',
      fontWeight: 600,
      textAlign: 'right',
    },
  }
}
