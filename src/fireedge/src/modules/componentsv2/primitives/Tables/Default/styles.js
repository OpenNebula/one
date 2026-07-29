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

const paddingScale = (theme, size) =>
  ({
    small: `${theme.scale[100]}px ${theme.scale[500]}px`,
    medium: `${theme.scale[500]}px ${theme.scale[500]}px`,
    large: `${theme.scale[600]}px ${theme.scale[500]}px`,
  }?.[size])

/**
 * @param {object} root0 - Params
 * @param {object} root0.theme - Current MUI theme
 * @param {string} root0.size - Row size
 * @param {boolean} root0.isDisabled - Disable interactions
 * @param {boolean} root0.isLoading - Is loading
 * @param {boolean} root0.isEmpty - Whether the table has no rows
 * @param {'small'|'medium'} root0.emptyContentSize - Empty content size
 * @param {number} root0.theadHeight - Table header ref height
 * @param {boolean} root0.isFullHeight - Is table full height
 * @returns {object} - Table SX styles
 */
export const getStyles = ({
  theme,
  size,
  isDisabled,
  isLoading,
  isEmpty,
  emptyContentSize,
  theadHeight,
  isFullHeight,
}) => {
  const isSmallEmptyContent = emptyContentSize === 'small'
  const emptyRowHeight = isSmallEmptyContent ? '112px' : '240px'
  const emptyRowPadding = isSmallEmptyContent
    ? `${theme.scale[300]}px ${theme.scale[500]}px`
    : `${theme.scale[900]}px ${theme.scale[500]}px`

  const rootStyles = {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: isFullHeight ? '100%' : 'auto',
    minWidth: 0,
  }

  const tableContainer = {
    display: 'flex',
    width: '100%',
    height: isFullHeight ? '100%' : 'auto',
    boxSizing: 'border-box',
    flexDirection: 'column',
    flexShrink: isFullHeight ? 1 : 0,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: `${theme.borderRadius['3xl']}px`,
    border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
    bgcolor: 'surface.primary',
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
  const table = {
    '& .table-toolbar': {
      display: 'flex',
      boxSizing: 'border-box',
      marginBottom: `${theme.scale[400]}px`,
      gap: `${theme.scale[100]}px`,
      alignItems: 'center',
      minWidth: 0,
    },

    '& .table-toolbar-search': {
      display: 'flex',
      flex: '1 1 auto',
      minWidth: 0,
    },

    '& .table-toolbar-custom': {
      display: 'flex',
      flex: '0 0 auto',
      alignItems: 'center',
      gap: `${theme.scale[100]}px`,
    },

    '& .table-container': {
      ...tableContainer,
    },

    '& .table-scroll': {
      display: 'flex',
      position: 'relative',
      width: '100%',
      flex: isFullHeight ? '1 1 auto' : '0 0 auto',
      minHeight: 0,
      overflowX: isEmpty ? 'hidden' : 'auto',
      overflowY: isFullHeight ? 'auto' : 'hidden',
      overscrollBehaviorX: 'contain',
    },

    '& .table-width-ruler': {
      display: 'block',
      position: 'absolute',
      visibility: 'hidden',
      boxSizing: 'border-box',
      height: 0,
      padding: 0,
      border: 0,
      pointerEvents: 'none',
    },

    '& .table-scroll table': {
      boxSizing: 'border-box',
      width: '100%',
      height: isFullHeight ? '100%' : 'auto',
      tableLayout: 'fixed',
      borderCollapse: 'separate',
      borderSpacing: 0,
      spacing: 0,
      gap: 0,
      margin: 0,
      bgcolor: 'surface.primary',
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

      '& .text-ellipsis': {
        display: 'block',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: '100%',
      },

      '& .menu-button-container': {
        display: 'flex',
        width: 'fit-content',
        marginLeft: 'auto',
      },

      '& th.table-title': {
        captionSide: 'top',
        textAlign: 'left',
        padding: `${theme.scale[200]}px ${theme.scale[500]}px ${theme.scale[100]}px ${theme.scale[500]}px`,
        borderBottom: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
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

      '& thead tr.table-header-row': {
        '& .text-ellipsis': {
          color: 'text.headings',
          fontWeight: 500,
        },
      },

      '& tbody tr:not(first-of-type) td': {
        color: 'text.body',
      },

      '& th, tr': {
        border: 'none',
        bgcolor: 'surface.primary',
      },

      '& th, & td': {
        textAlign: 'left',
        verticalAlign: 'middle',
        margin: 0,
        padding: paddingScale(theme, size),
      },

      '& thead tr.table-header-row th': {
        borderBottom: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
        textOverflow: 'ellipsis',
      },

      '& thead th > *': {
        display: 'flex',
        alignItems: 'center',
        alignSelf: 'stretch',
      },

      '& tbody tr:not(:last-of-type):not(.filler-row) td': {
        borderBottom: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
      },

      '& tbody tr:not(.selected):not(.filler-row):not(.table-empty-row):hover':
        {
          ...(!isDisabled &&
            !isLoading && {
              backgroundColor: theme.palette.surface.actionHover4,
              cursor: 'pointer',
            }),
        },

      '& tbody tr.selected:not(.filler-row):not(.table-empty-row):hover': {
        ...(!isDisabled &&
          !isLoading && {
            cursor: 'pointer',
          }),
      },

      '& tbody tr.selected': {
        backgroundColor: theme.palette.surface.focus2,
      },

      '& tbody tr.table-empty-row': {
        height: isFullHeight ? '100%' : emptyRowHeight,
      },

      '& tbody tr.table-empty-row td': {
        border: 'none',
        padding: 0,
        textAlign: 'center',
      },

      '& tbody': {
        height: isFullHeight ? `calc(100% - ${theadHeight}px)` : 'auto',
      },

      '& tbody tr.filler-row': {
        height: '100%',
        pointerEvents: 'none',
        '& td': {
          padding: 0,
          border: 'none',
        },
      },

      ...(isDisabled && {
        pointerEvents: 'none',
        cursor: 'not-allowed',
      }),
    },

    '& .table-empty-content': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxSizing: 'border-box',
      minHeight: emptyRowHeight,
      height: isFullHeight ? '100%' : 'auto',
      padding: emptyRowPadding,
      pointerEvents: 'none',
    },

    '& .table-empty-content-inner': {
      width: '100%',
      maxWidth: isSmallEmptyContent ? '640px' : '476px',
      pointerEvents: 'auto',
    },

    '& .table-footer': {
      display: 'flex',
      flexDirection: 'column',
      flex: '0 0 auto',
      width: '100%',
      boxSizing: 'border-box',
      borderTop: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
      bgcolor: 'surface.primary',
    },

    '& .table-footer-item': {
      width: '100%',
      boxSizing: 'border-box',
      padding: paddingScale(theme, size),
      bgcolor: 'surface.primary',
    },
  }

  return {
    ...rootStyles,
    ...table,
  }
}
