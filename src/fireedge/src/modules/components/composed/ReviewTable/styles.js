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
 * @param {object} props - Params
 * @param {object} props.theme - Current theme
 * @returns {object} Review table styles
 */
export const getStyles = ({ theme }) => {
  const header = {
    display: 'flex',
    alignItems: 'center',
    gap: `${theme.scale[400]}px`,

    '& .review-table-title': {
      color: theme.palette.text.headings,
      fontWeight: {
        xs: theme.fontWeight.heading.h3.mobile,
        sm: theme.fontWeight.heading.h3.tablet,
        md: theme.fontWeight.heading.h3.desktop,
      },
      fontSize: {
        xs: theme.fontSize.body.md.mobile,
        sm: theme.fontSize.body.md.tablet,
        md: theme.fontSize.body.md.desktop,
      },
      lineHeight: {
        xs: theme.lineHeight.body.md.mobile,
        sm: theme.lineHeight.body.md.tablet,
        md: theme.lineHeight.body.md.desktop,
      },
    },

    '& .review-table-edit': {
      marginLeft: 'auto',
      flexShrink: 0,
    },
  }

  const row = {
    display: 'grid',
    gridTemplateColumns: `minmax(${theme.scale[1700]}px, 30%) minmax(0, 1fr)`,

    '& .review-table-label, & .review-table-value': {
      padding: `14px ${theme.scale[500]}px`,
      textAlign: 'left',
      overflowWrap: 'anywhere',
      whiteSpace: 'pre-wrap',
      minWidth: 0,
    },
  }

  const table = {
    width: '100%',
    tableLayout: 'fixed',
    borderSpacing: 0,

    '& .review-table-row': row,

    '& .review-table-row + .review-table-row > *': {
      borderTop: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
    },
  }

  return {
    display: 'flex',
    flexDirection: 'column',
    gap: `${theme.scale[400]}px`,
    minWidth: 0,

    '& .review-table-header': header,

    '& .review-table-container': {
      border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
      borderRadius: `${theme.borderRadius['2xl']}px`,
      overflow: 'hidden',
      bgcolor: 'surface.primary',

      '& .review-table': table,
    },
  }
}
