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

export const CAPACITY_ACTION_SX = {
  padding: '0 0 0 8px',
  bgcolor: 'transparent',
  '&:hover': {
    color: 'icon.actionHover',
  },
}

/**
 * @param {object} theme - Current theme
 * @returns {object} - Capacity action group styles
 */
export const CAPACITY_ACTION_GROUP_SX = (theme) => ({
  bgcolor: 'transparent',
  padding: '0px',
  gap: `${theme.scale[100]}px`,
  justifyContent: 'flex-end',
})

/**
 * @param {object} root0 - Params
 * @param {object} root0.theme - Current theme
 * @returns {object} - Capacity panel styles
 */
export const getStyles = ({ theme }) => {
  const baseStyles = {
    overflow: 'auto',
    display: 'flex',
    flex: '1 1 0',
    minWidth: 0,
    minHeight: 0,
    flexDirection: 'column',
    alignItems: 'stretch',
    alignSelf: 'stretch',
    borderRadius: `${theme.borderRadius['3xl']}px`,
    border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
    bgcolor: 'surface.primary',
  }
  const title = {
    '& .capacity-header': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: `${theme.scale[300]}px`,
    },

    '& .capacity-title': {
      color: 'text.headings',
      fontFamily: 'Inter',
      fontStyle: 'normal',
      fontWeight: 600,
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
    '& .capacity-container': {
      display: 'grid',
      gridTemplateColumns: 'auto 1fr',
      alignSelf: 'stretch',
      columnGap: `${theme.scale[700]}px`,
      rowGap: `${theme.scale[300]}px`,
    },
  }
  const row = {
    '& .capacity-detail--row': {
      display: 'contents',
    },
    '& .capacity-detail--label': {
      color: 'text.body',
      '&::after': {
        content: '":"',
      },
    },
    '& .capacity-detail--value': {
      color: 'text.headings',

      display: 'block',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      maxWidth: '100%',
    },
    '& .capacity-loading-row': {
      gridColumn: '1 / -1',
    },
  }

  return {
    ...baseStyles,
    padding: `${theme.scale[550]}px ${theme.scale[600]}px`,
    gap: `${theme.scale[500]}px`,
    ...title,
    ...container,
    ...row,
  }
}
