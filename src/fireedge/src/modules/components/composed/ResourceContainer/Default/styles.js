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
 * @returns {object} - SearchBar styles
 */
export const getStyles = ({ theme }) => {
  const baseStyles = {
    display: 'flex',
    flexDirection: 'column',
    flex: '1 0 0',
    alignItems: 'flex-start',
    gap: '16px',

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

  const selectionContainer = {
    '& .active-filters-container': {
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '8px',
      alignSelf: 'stretch',
    },
    '& .active-filter-chip': {
      display: 'flex',
      height: 'auto',
      padding: `${theme.scale[50]}px ${theme.scale[300]}px`,
      justifyContent: 'center',
      alignItems: 'center',
      gap: `${theme.scale[100]}px`,
      borderRadius: `${theme.borderRadius['2xl']}px`,
      border: `${theme.borderWidth.sm}px solid ${theme.palette.border.action}`,
      bgcolor: 'surface.action',
      color: 'text.onAction',

      '&:hover': {
        bgcolor: 'surface.action',
      },

      '& .MuiChip-label': {
        padding: 0,
        color: 'text.onAction',
        fontFamily: 'var(--type-font-family-primary, Inter)',
        fontSize: {
          xs: theme.fontSize.body.caption.mobile,
          sm: theme.fontSize.body.caption.tablet,
          md: theme.fontSize.body.caption.desktop,
        },
        fontStyle: 'normal',
        fontWeight: 600,
        lineHeight: {
          xs: theme.lineHeight.body.caption.mobile,
          sm: theme.lineHeight.body.caption.tablet,
          md: theme.lineHeight.body.caption.desktop,
        },
      },

      '& .MuiChip-deleteIcon': {
        width: `${theme.scale[500]}px`,
        height: `${theme.scale[500]}px`,
        aspectRatio: '1 / 1',
        flexShrink: 0,
        margin: 0,
        color: 'text.onAction',

        '&:hover': {
          color: 'text.onAction',
        },
      },
    },
    '& .select-all-container': {
      display: 'flex',
      padding: `${theme.scale[200]}px 0 ${theme.scale[200]}px ${theme.scale[400]}px`,
      alignItems: 'center',
      alignSelf: 'stretch',
    },
    '& .empty-content-container': {
      alignItems: 'center',
      alignSelf: 'stretch',
      display: 'flex',
      flex: '1 1 0',
      justifyContent: 'center',
      minHeight: 0,
      width: '100%',
    },
  }

  return {
    ...baseStyles,
    ...selectionContainer,
  }
}
