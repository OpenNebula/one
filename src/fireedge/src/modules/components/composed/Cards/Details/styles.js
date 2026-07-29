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
 * @returns {object} - Fields styles
 */
export const getStyles = ({ theme }) => {
  const baseStyles = {
    overflow: 'auto',
    display: 'flex',
    flex: '1 1 0',
    minWidth: 0,
    minHeight: 0,
    padding: `${theme.scale[550]}px ${theme.scale[600]}px`,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: `${theme.scale[500]}px`,
    alignSelf: 'stretch',

    borderRadius: `${theme.borderRadius['3xl']}px`,
    border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
    bgcolor: 'surface.primary',
  }

  const title = {
    '& .details-title': {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: `${theme.scale[500]}px`,

      color: 'text.headings',
      fontFamily: 'Inter',
      fontWeight: 600,
      fontStyle: 'normal',
      fontSize: {
        xs: theme.fontSize.heading.h6.mobile,
        sm: theme.fontSize.heading.h6.tablet,
        md: theme.fontSize.heading.h6.desktop,
      },
      lineHeight: {
        xs: theme.lineHeight.heading.h5.mobile,
        sm: theme.lineHeight.heading.h5.tablet,
        md: theme.lineHeight.heading.h5.desktop,
      },
    },
  }

  const container = {
    '& .details-container': {
      display: 'grid',
      gridTemplateColumns: 'auto 1fr',
      alignSelf: 'stretch',
      columnGap: `${theme.scale[700]}px`,
      rowGap: `${theme.scale[300]}px`,
    },
  }

  const row = {
    '& .card-detail--row': {
      display: 'contents',
    },
    '& .card-detail--label': {
      color: 'text.body',
      '&::after': {
        content: '":"',
      },
    },
    '& .card-detail--value': {
      color: 'text.headings',
      cursor: 'pointer',

      display: 'block',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      maxWidth: '100%',
    },
  }

  return {
    ...baseStyles,
    ...title,
    ...container,
    ...row,
  }
}
