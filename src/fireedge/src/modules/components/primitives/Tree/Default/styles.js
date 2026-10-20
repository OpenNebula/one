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
 * @returns {object} - Tab SX style
 */
export const getStyles = ({ theme }) => {
  const treeGroup = {
    listStyle: 'none',

    margin: 0,
    padding: 0,
  }

  const treeItem = {
    cursor: 'pointer',
    padding: `${theme.scale[100]}px ${theme.scale[200]}px ${theme.scale[100]}px ${theme.scale[100]}px`,
    paddingLeft: `calc(${theme.scale[200]}px + (var(--tree-level, 0) * ${theme.scale[500]}px))`,
    display: 'flex',
    gap: `${theme.scale[200]}px`,
    alignItems: 'center',
    justifyContent: 'start',
    borderRadius: `${theme.borderRadius.xlg}px`,

    '& .expand-icon': {
      padding: `${theme.scale[100]}px`,
      display: 'flex',
      width: `${theme.scale[600]}px`,
      height: `${theme.scale[600]}px`,
      boxSizing: 'border-box',
      flexShrink: 0,

      '& svg': {
        width: `${theme.scale[500]}px`,
        height: `${theme.scale[500]}px`,
        color: theme.palette.icon.action,
        strokeWidth: 1.8,
      },
    },

    '& .content': {
      display: 'flex',
      minWidth: 0,
      gap: `${theme.scale[100]}px`,
      alignItems: 'center',
      justifyContent: 'start',

      '& > .tree-marker': {
        display: 'flex',
        margin: `${theme.scale[100]}px`,
        width: `${theme.scale[200]}px`,
        height: `${theme.scale[200]}px`,
        backgroundColor: theme.palette.surface.action,
        borderRadius: '50%',
      },

      '& > .icon': {
        display: 'flex',

        '& svg': {
          width: `${theme.scale[500]}px`,
          height: `${theme.scale[500]}px`,
          color: theme.palette.icon.primary,
          strokeWidth: 1.8,
        },
      },

      '& > .label': {
        userSelect: 'none',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        color: theme.palette.text.body,
        fontSize: {
          xs: theme.fontSize.body.sm.mobile,
          sm: theme.fontSize.body.sm.tablet,
          md: theme.fontSize.body.sm.desktop,
        },
        fontWeight: 500,
        lineHeight: {
          xs: theme.lineHeight.body.sm.mobile,
          sm: theme.lineHeight.body.sm.tablet,
          md: theme.lineHeight.body.sm.desktop,
        },
      },
    },

    '& .tree-count': {
      display: 'flex',
      flexShrink: 0,
      gap: `${theme.scale[100]}px`,
      marginLeft: 'auto',
      whiteSpace: 'nowrap',
      userSelect: 'none',
      color: theme.palette.text.headings,
      fontSize: {
        xs: theme.fontSize.body.caption.mobile,
        sm: theme.fontSize.body.caption.tablet,
        md: theme.fontSize.body.caption.desktop,
      },
      fontWeight: 600,
      lineHeight: {
        xs: theme.lineHeight.body.caption.mobile,
        sm: theme.lineHeight.body.caption.tablet,
        md: theme.lineHeight.body.caption.desktop,
      },

      '& > .descendant-count': {
        color: theme.palette.text.body,
        fontWeight: 400,
      },
    },

    '&:active': {
      outline: `2px solid ${theme.palette.border.focus2}`,
      outlineOffset: '2px',
      position: 'relative',
      zIndex: 1,
      borderRadius: `${theme.borderRadius.xlg}px`,
    },

    '&.selected': {
      '& .tree-count, & .descendant-count': {
        color: theme.palette.text.action,
      },

      '& .content': {
        '& > .icon svg': {
          color: theme.palette.icon.action,
        },

        '& > .label': {
          color: theme.palette.text.action,
        },
      },
    },

    '&.disabled': {
      cursor: 'initial',
      opacity: 0.6,
      pointerEvents: 'none',
    },

    '&:not(.has-children)': {
      minHeight: `${theme.scale[700]}px`,
    },

    '&:hover': {
      backgroundColor: theme.palette.surface.actionHover2,
    },
  }

  return {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    margin: 0,
    padding: `${theme.scale[200]}px`,
    maxWidth: '350px',

    '& .tree-item': treeItem,
    '& > li > .tree-item': {
      paddingLeft: `${theme.scale[100]}px`,
    },
    '& .tree-group': treeGroup,
  }
}
