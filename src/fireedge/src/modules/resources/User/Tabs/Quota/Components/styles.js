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
 * @param {object} root0 - Params.
 * @param {object} root0.theme - Current theme.
 * @returns {object} Quota usage panel styles.
 */
export const getStyles = ({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  flex: '1 1 0',
  height: '100%',
  minHeight: 0,
  gap: `${theme.scale[500]}px`,
  overflowX: 'hidden',
  overflowY: 'auto',
  overscrollBehavior: 'contain',
  scrollbarGutter: 'stable',

  '& .quota-usage-state': {
    display: 'flex',
    flex: 1,
    minHeight: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },

  '& .quota-usage-state-message': {
    color: 'text.secondary',
  },

  '& .quota-usage-scope': {
    border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
    borderRadius: `${theme.borderRadius.lg}px`,

    '& .quota-usage-scope-title': {
      padding: `${theme.scale[400]}px ${theme.scale[500]}px`,
      color: 'text.headings',
      fontWeight: theme.fontWeight.heading.h3.desktop,
      backgroundColor: 'surface.mute',
      borderBottom: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
    },
  },

  '& .quota-usage-row': {
    width: '100%',
    display: 'flex',
    alignItems: 'start',
    gap: `${theme.scale[400]}px`,
    padding: `${theme.scale[300]}px ${theme.scale[400]}px ${theme.scale[400]}px`,
    border: 0,
    backgroundColor: 'transparent',
    color: 'inherit',
    font: 'inherit',
    textAlign: 'left',
    cursor: 'pointer',

    '&:not(:last-child)': {
      borderBottom: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
    },

    '&:hover': {
      backgroundColor: 'surface.actionHover4',
    },

    '&:focus-visible': {
      outline: `${theme.borderWidth.md}px solid ${theme.palette.border.focus}`,
      outlineOffset: `-${theme.scale[50]}px`,
    },

    '& .quota-usage-name': {
      display: 'flex',
      alignItems: 'center',
      gap: `${theme.scale[200]}px`,
      minWidth: 0,
      width: '30%',

      '& .quota-usage-badge': {
        backgroundColor: `var(--quota-color, ${theme.palette.icon.action})`,
        width: `${theme.scale[500]}px`,
        height: `${theme.scale[500]}px`,
        borderRadius: `${theme.borderRadius.xlg}px`,
      },

      '& .quota-usage-name-label': {
        color: 'text.body',
        textTransform: 'uppercase',
        fontWeight: theme.typography.fontWeightMedium,

        fontSize: {
          xs: theme.fontSize.body.sm.mobile,
          sm: theme.fontSize.body.sm.tablet,
          md: theme.fontSize.body.sm.desktop,
        },
        lineHeight: {
          xs: theme.lineHeight.body.sm.mobile,
          sm: theme.lineHeight.body.sm.tablet,
          md: theme.lineHeight.body.sm.desktop,
        },
      },
    },

    '& .quota-usage-container': {
      paddingTop: `${theme.scale[50]}px`,
      width: '70%',

      '& .quota-usage-progress': {
        '& .progress-fill': {
          backgroundColor: `var(--quota-color, ${theme.palette.icon.action})`,
        },
      },

      '& .quota-usage-value': {
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'flex-end',
        gap: `${theme.scale[200]}px`,
        whiteSpace: 'nowrap',
        marginTop: `${theme.scale[50]}px`,

        '& .quota-usage-percentage, .quota-usage-value-label': {
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

        '& .quota-usage-value-label': {
          color: 'text.body',
          fontWeight: theme.typography.fontWeightMedium,
        },

        '& .quota-usage-percentage': {
          color: 'text.disabled',
        },
      },
    },
  },
})
