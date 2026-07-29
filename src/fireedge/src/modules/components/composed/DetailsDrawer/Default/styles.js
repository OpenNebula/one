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
 * @param {object} root0.stack - Stack metadata
 * @returns {object} - Detailsdrawer styles
 */
export const getStyles = ({ theme, stack = {} }) => {
  const layerOffset = stack?.hasStack
    ? (stack.index ?? 0) * theme.scale[700]
    : 0

  const baseStyles = {
    display: 'flex',
    flex: '1 0 0',
    minWidth: 0,
    height: '100%',
    width: 'fit-content',
    zIndex: stack?.hasStack
      ? theme.zIndex.drawer + 20 + (stack.index ?? 0)
      : theme.zIndex.drawer,

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

  const paperProps = {
    '& .detailsdrawer-paper': {
      display: 'inline-flex',
      flex: '1 0 0',
      minWidth: 0,
      width: stack?.hasStack
        ? `max(360px, calc(80vw - var(--sidebar-width, 0px) - ${layerOffset}px))`
        : 'calc(80vw - var(--sidebar-width, 0px))',
      height: 'calc(100vh - var(--sidebar-header-height, 0px))',
      marginTop: 'var(--sidebar-header-height, 0px)',
      padding: `${theme.scale[600]}px ${theme.scale[700]}px`,
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: `${theme.scale[550]}px`,
      borderRadius: `${theme.borderRadius?.['4xl']}px 0 0 ${theme.borderRadius?.['4xl']}px`,
      borderTop: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
      borderRight: `${theme.borderWidth.none}px solid ${theme.palette.border.primary}`,
      borderBottom: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
      borderLeft: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
      bgcolor: 'surface.primary',
      pointerEvents: stack?.hasStack && !stack?.isActive ? 'none' : 'auto',
      boxShadow:
        '-119px 0 33px 0 rgba(0, 0, 0, 0.00), -76px 0 30px 0 rgba(0, 0, 0, 0.01), -43px 0 26px 0 rgba(0, 0, 0, 0.02), -19px 0 19px 0 rgba(0, 0, 0, 0.03), -5px 0 10px 0 rgba(0, 0, 0, 0.04)',
    },

    '& .detailsdrawer-paper--background': {
      filter: 'saturate(0.92) brightness(0.98)',
    },
  }

  const stackStyles = {
    '& .detailsdrawer-stack-content': {
      display: 'flex',
      flex: '1 1 0',
      minWidth: 0,
      minHeight: 0,
      width: '100%',
      flexDirection: 'column',
      alignItems: 'stretch',
      alignSelf: 'stretch',
      gap: `${theme.scale[400]}px`,
    },

    '& .detailsdrawer-stack-tab': {
      appearance: 'none',
      position: 'absolute',
      top: `${theme.scale[600]}px`,
      left: 0,
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      width: `${theme.scale[700]}px`,
      maxHeight: `calc(100% - ${theme.scale[600] * 2}px)`,
      padding: 0,
      border: 0,
      bgcolor: 'transparent',
      color: 'text.body',
      cursor: 'pointer',
      pointerEvents: 'auto',

      '&:hover': {
        color: 'text.action',
      },

      '&:focus-visible': {
        outline: `${theme.borderWidth.md}px solid ${theme.palette.border.focus}`,
        outlineOffset: '-2px',
      },
    },

    '& .detailsdrawer-stack-tab-label': {
      display: 'inline-flex',
      alignItems: 'center',
      gap: `${theme.scale[100]}px`,
      maxHeight: '100%',
      minHeight: 0,
      writingMode: 'vertical-rl',
    },

    '& .detailsdrawer-stack-tab-icon': {
      flex: '0 0 auto',
      width: '14px',
      height: '14px',
    },

    '& .detailsdrawer-stack-tab-text': {
      display: 'block',
      minHeight: 0,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      fontSize: theme.fontSize.body.caption.desktop,
      fontWeight: theme.typography.fontWeightMedium,
      lineHeight: theme.lineHeight.body.caption.desktop,
    },

    '& .detailsdrawer-stack-header': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-start',
      minWidth: 0,
      minHeight: '32px',
      gap: `${theme.scale[400]}px`,
    },

    '& .detailsdrawer-stack-nav': {
      display: 'flex',
      alignItems: 'center',
      flex: '0 0 auto',
      gap: `${theme.scale[100]}px`,
    },

    '& .detailsdrawer-stack-arrow': {
      appearance: 'none',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '28px',
      height: '28px',
      padding: 0,
      borderRadius: `${theme.borderRadius.xlg}px`,
      border: `${theme.borderWidth.sm}px solid transparent`,
      bgcolor: 'transparent',
      color: 'text.action',
      cursor: 'pointer',

      '&:hover:not(:disabled)': {
        bgcolor: 'surface.actionHover2',
        borderColor: 'border.actionHover2',
        color: 'text.actionHover2',
      },

      '&:focus-visible': {
        outline: `${theme.borderWidth.md}px solid ${theme.palette.border.focus}`,
        outlineOffset: '2px',
      },

      '&:disabled': {
        color: 'text.onDisabled',
        cursor: 'default',
      },
    },

    '& .detailsdrawer-stack-count': {
      color: 'text.body',
      fontSize: theme.fontSize.body.caption.desktop,
      lineHeight: theme.lineHeight.body.caption.desktop,
    },

    '& .detailsdrawer-stack-breadcrumbs': {
      display: 'flex',
      alignItems: 'center',
      flex: '1 1 auto',
      minWidth: 0,
      overflow: 'hidden',
    },

    '& .detailsdrawer-stack-breadcrumbs .breadcrumb-links': {
      minWidth: 0,
    },

    '& .detailsdrawer-stack-breadcrumbs .breadcrumb-links ol': {
      display: 'flex',
      flexWrap: 'nowrap',
      alignItems: 'center',
      minWidth: 0,
      gap: `${theme.scale[100]}px`,
    },

    '& .detailsdrawer-stack-breadcrumbs .MuiBreadcrumbs-li': {
      display: 'flex',
      minWidth: 0,
    },

    '& .detailsdrawer-stack-breadcrumbs .MuiBreadcrumbs-separator': {
      margin: 0,
    },

    '& .detailsdrawer-stack-breadcrumbs .breadcrumb-item, & .detailsdrawer-stack-breadcrumbs a':
      {
        display: 'block',
        minWidth: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        color: 'text.body',
        fontSize: theme.fontSize.body.caption.desktop,
        fontWeight: theme.typography.fontWeightMedium,
        lineHeight: theme.lineHeight.body.caption.desktop,
      },

    '& .detailsdrawer-stack-breadcrumbs .breadcrumb-item.selected': {
      color: 'text.action',
    },
  }

  const slots = {
    '& .detailsdrawer-slots': {
      display: 'flex',
      flexDirection: 'column',
      flex: '1 1 0',
      minWidth: 0,
      minHeight: 0,
      width: '100%',
      alignItems: 'stretch',
      alignSelf: 'stretch',
      gap: `${theme.scale[550]}px`,
      overflow: 'hidden',
    },
  }

  const slot = {
    '& .detailsdrawer-slot': {
      display: 'flex',
      flex: '0 1 auto',
      minWidth: 0,
      minHeight: 0,
      width: '100%',
      overflow: 'hidden',
    },

    '& .detailsdrawer-slot:last-child': {
      flex: '1 1 0',
      flexDirection: 'column',
      overflow: 'auto',
    },

    '& .detailsdrawer-slot--TabSlot': {
      flex: '1 1 0',
      flexDirection: 'column',
      overflow: 'hidden',
    },
  }

  return {
    ...baseStyles,
    ...paperProps,
    ...stackStyles,
    ...slots,
    ...slot,
  }
}
