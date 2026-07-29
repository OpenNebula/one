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
 * @param {string} root0.type - Button type
 * @param {object} root0.theme - Current theme in use
 * @returns {object} - List SX style
 */
export const getStyles = ({ type, theme }) => {
  const isOrdered = type === 'ordered'
  const baseStyle = {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    flex: '1 0 0',
    alignSelf: 'stretch',

    overflow: 'hidden',
    borderRadius: `${theme.borderRadius?.['4xl']}px`,
    border: `${theme.scale[25]}px solid ${theme.palette.border.primary}`,
    bgcolor: 'surface.page',

    '& .list-container': {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: 0,
      overflow: 'auto',
      flex: '1 1 0',
      width: '100%',
    },
    '& .list-virtual-container': {
      position: 'relative',
      width: '100%',
    },

    '& .list-item': {
      display: 'flex',
      alignItems: 'center',
      gap: 0,
      color: 'text.body',
      alignSelf: 'stretch',
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
    },

    '& .row-indicator': {
      borderRadius: isOrdered ? 0 : '50%',
      bgcolor: isOrdered ? 'transparent' : 'text.body',
      minWidth: isOrdered ? '1.25rem' : '4px',
      height: isOrdered ? 'auto' : '4px',
      flexShrink: 0,
    },

    '& *': {
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
    },

    '& .list-header': {
      color: 'text.headings',

      fontSize: {
        xs: theme.fontSize.heading.h4.mobile,
        sm: theme.fontSize.heading.h4.tablet,
        md: theme.fontSize.heading.h4.desktop,
      },
      fontWeight: {
        xs: theme.fontWeight.heading.h4.mobile,
        sm: theme.fontWeight.heading.h4.tablet,
        md: theme.fontWeight.heading.h4.desktop,
      },
      lineHeight: {
        xs: theme.lineHeight.heading.h4.mobile,
        sm: theme.lineHeight.heading.h4.tablet,
        md: theme.lineHeight.heading.h4.desktop,
      },
    },
  }

  const overrides = {
    '& .MuiList-root': {
      paddingTop: 0,
      paddingBottom: 0,
    },
  }

  return {
    ...baseStyle,
    ...overrides,
  }
}
