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
 * Selectable card panel card styles.
 *
 * @param {object} params - Style params
 * @param {object} params.theme - Current theme
 * @returns {object} Selectable card panel card styles
 */
export const getSelectableCardPanelCardStyles = ({ theme }) => ({
  '&.selectable-card-panel-card': {
    display: 'flex',
    alignItems: 'center',
    gap: `${theme.scale[400]}px`,
    minWidth: 0,
    padding: `${theme.scale[300]}px ${theme.scale[400]}px`,
    backgroundColor: 'surface.primary',
    border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
    borderRadius: `${theme.borderRadius.xlg}px`,
    cursor: 'pointer',
    position: 'relative',

    '&:hover': {
      borderColor: theme.palette.border.actionHover,

      '& .selectable-card-panel-card-remove': {
        opacity: 1,
        pointerEvents: 'auto',
      },
    },

    '&:focus-within .selectable-card-panel-card-remove': {
      opacity: 1,
      pointerEvents: 'auto',
    },

    '&.selected': {
      borderColor: theme.palette.border.actionHover,

      '&::before': {
        content: '""',
        height: '70%',
        position: 'absolute',
        left: `-${theme.scale[25]}px`,
        borderRadius: '0 3px 3px 0',
        width: `${theme.scale[100]}px`,
        backgroundColor: theme.palette.border.actionHover,
      },
    },

    '& .icon': {
      display: 'flex',
      alignItems: 'center',
      borderRadius: `${theme.borderRadius.xlg}px`,
      backgroundColor: 'surface.disabled',
      color: 'icon.action',
      padding: `${theme.scale[200]}px`,

      '& .svg': {
        width: `${theme.scale[500]}px`,
        height: `${theme.scale[500]}px`,
      },
    },

    '& .card-content': {
      display: 'flex',
      flexDirection: 'column',
      flexGrow: 1,
      minWidth: 0,

      '& .title': {
        color: 'text.headings',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        maxWidth: '100%',
        fontSize: {
          xs: theme.fontSize.body.sm.mobile,
          sm: theme.fontSize.body.sm.tablet,
          md: theme.fontSize.body.sm.desktop,
        },
        fontWeight: {
          xs: 500,
          sm: 500,
          md: 500,
        },
        lineHeight: {
          xs: theme.lineHeight.body.sm.mobile,
          sm: theme.lineHeight.body.sm.tablet,
          md: theme.lineHeight.body.sm.desktop,
        },
      },

      '& .subtitle': {
        color: 'text.disabled',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        maxWidth: '100%',
        fontSize: {
          xs: theme.fontSize.body.caption.mobile,
          sm: theme.fontSize.body.caption.tablet,
          md: theme.fontSize.body.caption.desktop,
        },
        fontWeight: {
          xs: 500,
          sm: 500,
          md: 500,
        },
        lineHeight: {
          xs: theme.lineHeight.body.caption.mobile,
          sm: theme.lineHeight.body.caption.tablet,
          md: theme.lineHeight.body.caption.desktop,
        },
      },
    },

    '& .selectable-card-panel-card-remove': {
      opacity: 0,
      pointerEvents: 'none',
      padding: `${theme.scale[100]}px`,

      '& svg': {
        width: `14px`,
        height: `14px`,
      },
    },
  },
})

/**
 * Selectable card panel styles.
 *
 * @param {object} params - Style params
 * @param {object} params.theme - Current theme
 * @param {number} params.sidebarSize - Size of the sidebar in percentage
 * @param {string} params.sidebarPosition - Sidebar render position
 * @returns {object} Selectable card panel styles
 */
export const getSelectableCardPanelStyles = ({
  theme,
  sidebarSize = 30,
  sidebarPosition = 'left',
}) => {
  const isBottom = sidebarPosition === 'bottom'

  return {
    '&.selectable-card-panel': {
      display: 'flex',
      flexDirection: isBottom ? 'column' : 'row',
      gap: `${theme.scale[400]}px`,
      width: '100%',
      alignItems: 'stretch',

      '& .sidebar': {
        alignSelf: isBottom ? 'flex-start' : 'stretch',
        display: 'flex',
        flexDirection: 'column',
        gap: `${theme.scale[300]}px`,
        order: isBottom ? 2 : 0,
        width: `${sidebarSize}%`,
        minWidth: `${sidebarSize}%`,
        maxWidth: `${sidebarSize}%`,

        '& .sidebar-list': {
          display: 'flex',
          flexDirection: 'column',
          gap: `${theme.scale[200]}px`,
        },
      },

      '& .panel': {
        flexGrow: 1,
        minWidth: 0,
        order: isBottom ? 1 : 0,
        width: isBottom ? '100%' : 'auto',
      },
    },
  }
}
