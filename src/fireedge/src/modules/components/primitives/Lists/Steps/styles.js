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
 * @param {string} root0.variant - Step marker layout
 * @returns {object} - StepList styles
 */
export const getStyles = ({ theme, variant }) => {
  const baseStyles = {
    alignSelf: 'stretch',

    '& .steplist-container': {
      display: 'flex',
      flexDirection: 'column',
      gap: `${theme.scale[50]}px`,
      margin: 0,
      padding: 0,
      listStyle: 'none',
    },

    '& .steplist-item': {
      display: 'grid',
      gridTemplateColumns: `${theme.scale[600]}px 1fr`,
      gap: `${theme.scale[200]}px`,
      alignItems: 'start',
      color: 'text.body',

      '&.MuiListItem-root': {
        display: 'grid',
      },
    },

    '& .item-marker': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: `${theme.scale[600]}px`,
      height: `${theme.scale[600]}px`,
      borderRadius: `${theme.borderRadius.round}px`,
      flexShrink: 0,
      bgcolor: 'surface.actionHover4',
      color: 'text.body',
      fontSize: {
        xs: theme.fontSize.body.md.mobile,
        sm: theme.fontSize.body.md.tablet,
        md: theme.fontSize.body.md.desktop,
      },
      fontWeight: {
        xs: theme.fontWeight.heading.h6.mobile,
        sm: theme.fontWeight.heading.h6.tablet,
        md: theme.fontWeight.heading.h6.desktop,
      },
      lineHeight: {
        xs: theme.lineHeight.body.md.mobile,
        sm: theme.lineHeight.body.md.tablet,
        md: theme.lineHeight.body.md.desktop,
      },
    },

    '& .item-content': {
      color: 'text.body',
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

    '& .item-content a': {
      color: 'text.information',
      fontSize: {
        xs: theme.fontSize.body.sm.mobile,
        sm: theme.fontSize.body.sm.tablet,
        md: theme.fontSize.body.sm.desktop,
      },
      fontWeight: {
        xs: theme.fontWeight.heading.h6.mobile,
        sm: theme.fontWeight.heading.h6.tablet,
        md: theme.fontWeight.heading.h6.desktop,
      },
      lineHeight: {
        xs: theme.lineHeight.body.sm.mobile,
        sm: theme.lineHeight.body.sm.tablet,
        md: theme.lineHeight.body.sm.desktop,
      },
      textDecoration: 'none',

      '&:hover': {
        textDecoration: 'underline',
      },
    },
  }

  return {
    ...baseStyles,
    ...(variant === 'timeline' && {
      '& .steplist-container': {
        ...baseStyles['& .steplist-container'],
        gap: `${theme.scale[500]}px`,
      },
      '& .steplist-item': {
        ...baseStyles['& .steplist-item'],
        position: 'relative',
        gridTemplateColumns: `${theme.scale[600]}px minmax(0, 1fr)`,
        gap: `${theme.scale[300]}px`,
      },
      '& .steplist-item:not(:last-child)::after': {
        content: '""',
        position: 'absolute',
        top: `${theme.scale[600]}px`,
        bottom: `-${theme.scale[500]}px`,
        left: `calc(${theme.scale[600]}px / 2)`,
        borderLeft: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
      },
      '& .item-marker': {
        ...baseStyles['& .item-marker'],
        alignItems: 'flex-start',
        bgcolor: 'transparent',
        borderRadius: 0,
        color: 'text.secondary',
        fontWeight: 400,
      },
      '& .item-content': {
        ...baseStyles['& .item-content'],
        minWidth: 0,
      },
    }),
  }
}
