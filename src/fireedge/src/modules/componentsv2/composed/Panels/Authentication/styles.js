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
 * @returns {object} - Authentication tab SX style
 */
export const getStyles = ({ theme }) => ({
  display: 'flex',
  width: '100%',
  flex: '1 1 auto',
  height: '100%',
  minHeight: 0,
  boxSizing: 'border-box',
  flexDirection: 'column',
  alignItems: 'stretch',
  gap: `${theme.scale[500]}px`,
  overflow: 'auto',

  '& .title': {
    marginBottom: `${theme.scale[500]}px`,
    color: 'text.headings',
    fontSize: {
      xs: theme.fontSize.heading.h6.mobile,
      sm: theme.fontSize.heading.h6.tablet,
      md: theme.fontSize.heading.h6.desktop,
    },
    fontWeight: theme.fontWeight.heading.h6.desktop,
    lineHeight: {
      xs: theme.lineHeight.heading.h6.mobile,
      sm: theme.lineHeight.heading.h6.tablet,
      md: theme.lineHeight.heading.h6.desktop,
    },
  },

  '& .container': {},

  '& .section': {
    display: 'flex',
    gap: `${theme.scale[300]}px`,
    padding: `${theme.scale[400]}px 0`,
  },

  '& .section:first-of-type': {
    display: 'grid',
    gridTemplateColumns: {
      xs: '1fr',
      md: 'repeat(2, minmax(0, 1fr))',
    },
    alignItems: 'start',

    '& > *': {
      minWidth: 0,
      width: '100%',
    },

    '& .dropdown, & .textfield-container, & .textfield-root, & .textfield-input-wrapper':
      {
        minWidth: 0,
        width: '100%',
      },

    '& .textfield-input': {
      minWidth: 0,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
  },

  '& .authentication-actions': {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: `${theme.scale[300]}px`,
  },
})
