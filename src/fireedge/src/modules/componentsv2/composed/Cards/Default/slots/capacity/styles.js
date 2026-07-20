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
 * @param {object} root0 - Parameters
 * @param {object} root0.theme - Current theme
 * @returns {object} Slot styles
 */
export const getStyles = ({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: `${theme.scale[400]}px`,
  maxWidth: '100%',

  '& .capacity-item': {
    display: 'inline-flex',
    alignItems: 'center',
    gap: `${theme.scale[100]}px`,
    minWidth: 0,
    whiteSpace: 'nowrap',
  },

  '& .capacity-icon': {
    flexShrink: 0,
    width: `${theme.scale[500]}px`,
    height: `${theme.scale[500]}px`,
    color: 'icon.primary',
  },

  '& .capacity-label, & .capacity-value': {
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
  },

  '& .capacity-label': {
    color: 'text.body',
    fontWeight: theme.typography.fontWeightMedium,
  },

  '& .capacity-value': {
    color: 'text.headings',
    fontWeight: {
      xs: theme.fontWeight.heading.h6.mobile,
      sm: theme.fontWeight.heading.h6.tablet,
      md: theme.fontWeight.heading.h6.desktop,
    },
  },
})
