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
import { variables } from '@StylesModule'

const getStatusModifiers = ({ theme, isOpen }) => ({
  content: {
    ...(isOpen
      ? {
          alignItems: 'center',
        }
      : {
          alignItems: 'flex-start',
          alignSelf: 'stretch',
        }),
  },
})

/**
 * @param {object} root0 - Params
 * @param {boolean} root0.isOpen - Open
 * @param {object} root0.theme - Theme in use
 * @returns {object} - Sidebar styles
 */
export const getStyles = ({ theme, isOpen }) => {
  const { content } = getStatusModifiers({
    theme,
    isOpen,
  })
  const baseStyles = {
    transition: 'all 0.2s ease', // remove snapping
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: `${theme.scale[100]}px`,
    alignSelf: 'stretch',

    fontStyle: 'normal',
    fontFamily: 'Inter',

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

  const sidebar = {
    '& .sidebar': {
      display: 'inline-flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      minWidth: `${theme.scale[1700] - theme.scale[50]}px`,
      overflow: 'visible',

      '& .MuiDrawer-paper': {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        overflow: 'visible',
        bgcolor: 'surface.primary',
        borderRight: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
      },
    },
  }

  const sidebarHeader = {
    '& .sidebar-header': {
      display: 'flex',
      flex: '0 0 auto',
      alignItems: 'center',
      alignSelf: 'stretch',
      padding: `${theme.scale[0]}px ${theme.scale[200]}px`,
      justifyContent: isOpen ? 'space-between' : 'center',
      height: `${theme.scale[900]}px`,
      minHeight: `${theme.scale[900]}px`,
      borderBottom: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,

      '& .sidebar-header-logo': {
        display: 'flex',
        alignItems: 'center',
        padding: `${theme.scale[200]}px`,
        overflow: 'visible',

        '& .opennebula-icon-frame': {
          display: 'flex',
          alignItems: 'center',
        },
      },

      '& .sidebar-fixed-toggle-container': {
        display: 'flex',
        height: `${theme.scale[600] + theme.scale[100]}px`,
        padding: `${theme.scale[150]}px`,
        alignItems: 'center',
        gap: `${theme.scale[300]}px`,

        '& .sidebar-toggle-button': {
          color: 'icon.primary',

          '&:active': {
            bgcolor: 'surface.focus2',
            outline: `${theme.borderWidth.md}px solid ${theme.palette.border.focus2}`,
            outlineOffset: `${theme.borderWidth.md}px`,
          },
        },
      },
    },
  }

  const userAvatar = {
    padding: theme.scale[0],
    display: 'flex',
    background: 'transparent',
    border: 'none',
    width: '100%',
    alignItems: 'center',
    borderRadius: `${theme.borderRadius['2xl']}px`,

    '&.expanded': {
      padding: `${theme.scale[200]}px ${theme.scale[200]}px ${theme.scale[100]}px`,
    },

    '& .avatar': {
      border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
      borderRadius: `${theme.borderRadius.xlg}px`,
      width: `${theme.scale[700]}px`,
      height: `${theme.scale[700]}px`,
    },

    '& .user-info': {
      marginLeft: `${theme.scale[200]}px`,
      display: 'flex',
      flexGrow: 1,
      flexDirection: 'column',
      alignItems: 'flex-start',

      '& .name': {
        color: 'text.headings',
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
      },

      '& .subtitle': {
        color: 'text.body',
        fontSize: {
          xs: theme.fontSize.body.caption.mobile,
          sm: theme.fontSize.body.caption.tablet,
          md: theme.fontSize.body.caption.desktop,
        },
        fontWeight: {
          xs: theme.fontWeight.body.caption.mobile,
          sm: theme.fontWeight.body.caption.tablet,
          md: theme.fontWeight.body.caption.desktop,
        },
        lineHeight: {
          xs: theme.lineHeight.body.caption.mobile,
          sm: theme.lineHeight.body.caption.tablet,
          md: theme.lineHeight.body.caption.desktop,
        },
      },
    },
  }

  const userMenuItem = {
    '& .user-menu-item': {
      display: 'flex',
      borderRadius: `${theme.borderRadius.xlg}px`,
      gap: `${theme.scale[200]}px`,
      padding: `${theme.scale[150]}px ${theme.scale[200]}px`,

      '&:hover': {
        bgcolor: 'surface.actionHover4',

        '& .label': {
          color: 'text.actionHover2',
        },
      },

      '& .icon': {
        width: `${theme.scale[500]}px`,
        height: `${theme.scale[500]}px`,
        strokeWidth: 1.6,
        color: 'icon.primary',
      },

      '& .label': {
        flexGrow: 1,
        userSelect: 'none',
        color: 'text.body',
        fontWeight: {
          xs: theme.typography.fontWeightMedium,
          sm: theme.typography.fontWeightMedium,
          md: theme.typography.fontWeightMedium,
        },
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
  }

  const sidebarFooter = {
    '& .sidebar-footer': {
      position: 'relative',
      zIndex: theme.zIndex.drawer + 1,
      display: 'flex',
      flexDirection: 'column',
      flex: '0 0 auto',
      marginTop: 'auto',
      padding: isOpen
        ? `${theme.scale[200]}px ${theme.scale[200]}px ${theme.scale[100]}px`
        : `${theme.scale[200]}px`,
      gap: `${theme.scale[100]}px`,
      borderTop: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,

      '& .user-menu': {
        position: 'relative',
        zIndex: theme.zIndex.drawer + 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flexStart',
        gap: `${theme.scale[100]}px`,

        '#sidebar-user-menu': {
          zIndex: theme.zIndex.drawer + 2,
        },

        '& .popup': {
          zIndex: theme.zIndex.drawer + 2,

          '& .section': {
            padding: `${theme.scale[150]}px`,

            ...userMenuItem,
          },

          '& .user-avatar': {
            ...userAvatar,
          },
        },

        '& .meta-info': {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: `${theme.scale[50]}px`,

          '& .one-version': {
            minWidth: '36px',
            color: 'text.disabled',
            fontSize: {
              xs: theme.typography.pxToRem(theme.scale[300]),
              sm: theme.typography.pxToRem(theme.scale[300]),
              md: theme.typography.pxToRem(theme.scale[300]),
            },
            fontWeight: {
              xs: theme.typography.fontWeightMedium,
              sm: theme.typography.fontWeightMedium,
              md: theme.typography.fontWeightMedium,
            },
            marginRight: `${theme.scale[500]}px`,
            lineHeight: {
              xs: theme.lineHeight.body.caption.mobile,
              sm: theme.lineHeight.body.caption.tablet,
              md: theme.lineHeight.body.caption.desktop,
            },
          },

          '& .one-supported': {
            padding: `${theme.scale[50]}px ${theme.scale[200]}px`,
            fontSize: {
              xs: theme.fontSize.body.caption.mobile,
              sm: theme.fontSize.body.caption.tablet,
              md: theme.fontSize.body.caption.desktop,
            },
            fontWeight: {
              xs: theme.fontWeight.heading.h6.mobile,
              sm: theme.fontWeight.heading.h6.tablet,
              md: theme.fontWeight.heading.h6.desktop,
            },
            lineHeight: {
              xs: theme.lineHeight.body.caption.mobile,
              sm: theme.lineHeight.body.caption.tablet,
              md: theme.lineHeight.body.caption.desktop,
            },
            border: `${theme.borderWidth.sm}px solid`,
            borderRadius: `${theme.borderRadius['2xl']}px`,

            '&.supported': {
              color: 'text.success',
              borderColor: theme.palette.border.success,
              backgroundColor: 'surface.success',
            },

            '&.unsuported': {
              color: 'text.disabled',
              borderColor: theme.palette.border.disabled,
              backgroundColor: 'surface.disabled',
            },
          },
        },
      },
    },
  }

  const roleOption = {
    '& .option': {
      padding: `${theme.scale[150]}px ${theme.scale[200]}px ${theme.scale[150]}px ${theme.scale[300]}px`,
      display: 'grid',
      gridTemplateColumns: `${theme.scale[500]}px minmax(${theme.scale[0]}, 1fr) ${theme.scale[500]}px`,
      gap: `${theme.scale[200]}px`,
      alignItems: 'center',
      borderRadius: `${theme.borderRadius.xlg}px`,

      '&:hover': {
        bgcolor: 'surface.actionHover4',

        '& .copy .title': {
          color: 'text.actionHover2',
        },
      },

      '&.selected': {
        bgcolor: 'surface.focus2',

        '& .icon, & .copy .title, & .check,': {
          color: 'text.focus',
        },
      },

      '& .icon, & .check': {
        justifySelf: 'center',
        width: `${theme.scale[500]}px`,
        height: `${theme.scale[500]}px`,
        color: 'icon.primary',
        strokeWidth: 1.6,
      },

      '& .copy': {
        display: 'flex',
        flexGrow: 1,
        flexDirection: 'column',
        gap: `${theme.scale[100]}px`,
        minWidth: 0,

        '& .title': {
          color: 'text.body',
          fontSize: {
            xs: theme.fontSize.body.sm.mobile,
            sm: theme.fontSize.body.sm.tablet,
            md: theme.fontSize.body.sm.desktop,
          },
          fontWeight: {
            xs: theme.typography.fontWeightMedium,
            sm: theme.typography.fontWeightMedium,
            md: theme.typography.fontWeightMedium,
          },
          lineHeight: {
            xs: theme.lineHeight.body.sm.mobile,
            sm: theme.lineHeight.body.sm.tablet,
            md: theme.lineHeight.body.sm.desktop,
          },
          minWidth: 0,
          whiteSpace: 'normal',
          overflowWrap: 'break-word',
        },

        '& .description': {
          color: 'text.body',
          fontSize: {
            xs: theme.fontSize.body.caption.mobile,
            sm: theme.fontSize.body.caption.tablet,
            md: theme.fontSize.body.caption.desktop,
          },
          fontWeight: {
            xs: theme.fontWeight.body.caption.mobile,
            sm: theme.fontWeight.body.caption.tablet,
            md: theme.fontWeight.body.caption.desktop,
          },
          lineHeight: {
            xs: theme.lineHeight.body.caption.mobile,
            sm: theme.lineHeight.body.caption.tablet,
            md: theme.lineHeight.body.caption.desktop,
          },
          minWidth: 0,
          whiteSpace: 'normal',
          overflowWrap: 'break-word',
        },
      },
    },
  }

  const roleMenu = {
    '& .role-menu': {
      display: 'flex',
      margin: [
        `${theme.scale[200]}px`,
        `${theme.scale[100] - theme.scale[25]}px`,
        `${theme.scale[100]}px`,
      ].join(' '),
      alignSelf: 'stretch',

      '& .dropdown.without-image': {
        padding: `${theme.scale[100] + theme.scale[25]}px`,
        margin: `${theme.scale[100] - theme.scale[25]}px`,
        display: 'flex',
        gap: `${theme.scale[200]}px`,

        '&.admin .avatar': {
          backgroundColor: variables.pink[400],
          borderColor: 'none',
        },

        '&.cloud .avatar': {
          backgroundColor: variables.orange[400],
          borderColor: 'none',
        },

        '&.user .avatar': {
          backgroundColor: variables.rose[400],
          borderColor: 'none',
        },

        '&.groupadmin .avatar': {
          backgroundColor: variables.purple[400],
          borderColor: 'none',
        },

        '& .avatar': {
          width: `${theme.scale[600] + theme.scale[50]}px`,
          height: `${theme.scale[600] + theme.scale[50]}px`,
          color: '#fff',
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
          backgroundColor: variables.pink[400],
          border: 'none',
        },

        '& .info': {
          margin: 0,

          '& .title': {
            color: 'text.body',
          },
        },
      },

      '#sidebar-role-menu': {
        zIndex: theme.zIndex.drawer + 1,
        boxShadow:
          '0 4px 6px -4px rgba(0, 0, 0, 0.10), 0 10px 15px -13px rgba(0, 0, 0, 0.10)',

        '& .popup': {
          '& .panel': {
            display: 'flex',
            flexDirection: 'column',
            padding: `${theme.scale[100]}px`,

            '& .header': {
              display: 'flex',
              flexDirection: 'column',
              gap: `${theme.scale[100]}px`,
              padding: `${theme.scale[150]}px ${theme.scale[200]}px ${theme.scale[150]}px ${theme.scale[300]}px`,

              '& .title': {
                color: 'text.headings',
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
              },

              '& .subtitle': {
                color: 'text.body',
                fontSize: {
                  xs: theme.fontSize.body.caption.mobile,
                  sm: theme.fontSize.body.caption.tablet,
                  md: theme.fontSize.body.caption.desktop,
                },
                fontWeight: {
                  xs: theme.fontWeight.body.caption.mobile,
                  sm: theme.fontWeight.body.caption.tablet,
                  md: theme.fontWeight.body.caption.desktop,
                },
                lineHeight: {
                  xs: theme.lineHeight.body.caption.mobile,
                  sm: theme.lineHeight.body.caption.tablet,
                  md: theme.lineHeight.body.caption.desktop,
                },
              },
            },

            '& .divider': {
              margin: `${theme.scale[50]}px 0`,
            },

            '& .options': {
              display: 'flex',
              flexDirection: 'column',

              ...roleOption,
            },
          },
        },
      },
    },
  }

  const sidebarContent = {
    '& .sidebar-content': {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 0,
      flex: '1 1 auto',
      minHeight: 0,
      overflow: 'auto',
      ...content,
      ...roleMenu,
    },

    '& .sidebar-content-section': {
      display: 'flex',
      width: isOpen ? '100%' : 'auto',
      flexDirection: 'column',
      gap: 0,
      padding: `0 ${theme.scale[200]}px ${theme.scale[200]}px ${theme.scale[200]}px`,
      justifyContent: 'center',
      alignItems: isOpen ? 'flex-start' : 'center',
    },

    '& .sidebar-content-section-list': {
      width: isOpen ? '100%' : `${theme.scale[700]}px`,
    },
  }

  const sidebarItem = {
    '& .sidebar-item': {
      position: 'relative',
      zIndex: 0,

      '&.active, &:has(.selected)': {
        zIndex: 1,
      },

      '& .container': {
        position: 'relative',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        padding: `${theme.scale[100]}px ${theme.scale[200]}px`,
        gap: `${theme.scale[200]}px`,
        borderRadius: `${theme.borderRadius.xlg}px`,

        '&:hover': {
          bgcolor: 'surface.actionHover4',
        },

        '& .icon': {
          width: `${theme.scale[500]}px`,
          height: `${theme.scale[500]}px`,
          margin: `${theme.scale[50]}px ${theme.scale[0]}px`,
          strokeWidth: 1.6,
          color: 'icon.primary',
        },

        '& .title': {
          flexGrow: 1,
          userSelect: 'none',
          color: 'text.body',
          fontWeight: {
            xs: theme.typography.fontWeightMedium,
            sm: theme.typography.fontWeightMedium,
            md: theme.typography.fontWeightMedium,
          },
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

      '& .collapsible-list': {
        padding: 0,
        marginLeft: `${theme.scale[500]}px`,
        marginTop: `${theme.scale[100]}px`,
      },
    },

    '& .sidebar-item.child': {
      '& .container': {
        borderLeft: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
        borderRadius: `0 ${theme.borderRadius.xlg}px ${theme.borderRadius.xlg}px 0`,

        '&:hover, &.selected': {
          borderColor: 'border.actionHover',
          bgcolor: 'surface.actionHover4',

          '& .title': {
            color: 'text.actionHover2',
          },
        },
      },
    },

    '& .sidebar-item.parent > .container:active, & .sidebar-item.parent.active:not(.expanded) > .container':
      {
        zIndex: 1,
        bgcolor: 'surface.focus2',
        outline: `${theme.borderWidth.md}px solid ${theme.palette.border.focus2}`,
        outlineOffset: `${theme.borderWidth.md}px`,

        '& .title, & .icon': {
          color: 'text.focus',
        },
      },
  }

  const overrides = {
    '& .MuiDivider-root': {
      borderColor: theme.palette.border.primary,
    },

    '& .MuiListItemIcon-root': {
      minWidth: 'unset',
    },

    '& .MuiListItemButton-root': {
      padding: 0,
    },
  }

  return {
    ...baseStyles,
    ...sidebar,
    ...sidebarHeader,
    ...sidebarContent,
    ...sidebarItem,
    ...sidebarFooter,
    ...overrides,
  }
}
