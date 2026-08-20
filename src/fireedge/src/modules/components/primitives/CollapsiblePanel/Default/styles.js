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
 * @returns {object} Collapsible panel styles
 */
export const getStyles = ({ theme }) => ({
  '&.collapsible-panel': {
    width: '100%',
    overflow: 'hidden',
    border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
    bgcolor: 'surface.primary',
    boxShadow: 'none',
    borderTop: 'none',

    '&:first-child': {
      borderTop: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
      borderRadius: `${theme.borderRadius['2xl']}px ${theme.borderRadius['2xl']}px 0 0`,
    },

    '&:last-child': {
      borderRadius: `0 0 ${theme.borderRadius['2xl']}px ${theme.borderRadius['2xl']}px`,
    },

    '&:only-child': {
      borderRadius: `${theme.borderRadius['2xl']}px`,
    },

    '& .summary': {
      display: 'flex',
      alignItems: 'center',
      gap: `${theme.scale[400]}px`,
      padding: `${theme.scale[500]}px ${theme.scale[550]}px`,

      '& .MuiAccordionSummary-content': {
        display: 'flex',
        margin: 0,
        alignItems: 'center',
        gap: `${theme.scale[400]}px`,

        '& .title': {
          flex: '1 1 auto',
          color: 'text.headings',
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
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        },
      },

      '& .MuiAccordionSummary-expandIconWrapper': {
        color: 'icon.primary',
        display: 'flex',

        '& svg': {
          width: `${theme.scale[500]}px`,
          height: `${theme.scale[500]}px`,
          strokeWidth: 1.8,
        },
      },
    },

    '& .content': {
      borderTop: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
      padding: `${theme.scale[600]}px ${theme.scale[550]}px`,
    },
  },
})
