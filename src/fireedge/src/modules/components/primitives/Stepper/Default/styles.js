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
 * @param {object} props.theme - Current theme in use
 * @param {'vertical'|'horizontal'} props.direction - Stepper direction
 * @param {boolean} props.isCompact - Compact steps and expand the active step connectors
 * @returns {object} - Stepper SX styles
 */
export const getStyles = ({
  theme,
  direction = 'vertical',
  isCompact = false,
}) => {
  const isHorizontal = direction === 'horizontal'

  const stepMarker = {
    width: `${theme.scale[600]}px`,
    height: `${theme.scale[600]}px`,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: `1px solid transparent`,
    color: theme.palette.text.headings,
    backgroundColor: theme.palette.surface.page,
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

    '&.has-icon': {
      color: theme.palette.icon.primary,

      '& svg': {
        width: `${theme.scale[500]}px`,
        height: `${theme.scale[500]}px`,
      },
    },

    '&.pending': {
      backgroundColor: 'transparent',
      color: theme.palette.text.disabled,

      '&.has-icon': {
        backgroundColor: theme.palette.surface.disabled2,
        color: theme.palette.icon.primary,
      },
    },

    '&.completed': {
      color: theme.palette.text.success,
      backgroundColor: theme.palette.surface.success,
    },

    '&.active': {
      '&.in-progress': {
        borderColor: theme.palette.border.action,
      },

      '&.reviewing': {
        borderColor: theme.palette.border.warning,
      },

      '&.error': {
        borderColor: theme.palette.border.error,
      },
    },
  }

  const stepLabel = {
    display: 'flex',
    flexDirection: 'column',
    textAlign: isHorizontal ? 'center' : 'left',
    width: isHorizontal ? 'auto' : '111px',
    alignItems: isHorizontal ? 'center' : 'flex-start',

    '& .number, & .title': {
      color: theme.palette.text.onDisabled,
    },

    '&.in-progress, &.reviewing, &.error': {
      '& .title': {
        color: theme.palette.text.headings,
      },
    },

    '&.pending .title': {
      color: theme.palette.text.disabled,
    },

    '&.in-progress .status': {
      color: theme.palette.text.action,
    },

    '&.completed .status': {
      color: theme.palette.text.success,
    },

    '&.reviewing .status': {
      color: theme.palette.text.warning,
    },

    '&.error .status': {
      color: theme.palette.text.error,
    },
  }

  return {
    zIndex: theme.zIndex.mobileStepper,

    '& > .stepper-list': {
      position: 'relative',
      listStyle: 'none',
      margin: 0,
      padding: 0,
      display: 'flex',
      maxHeight: 'inherit',
      flexDirection: isHorizontal ? 'row' : 'column',
      alignItems: isHorizontal ? 'flex-start' : 'stretch',
      gap: isHorizontal ? 0 : `${theme.scale[100]}px`,
      paddingBottom: isHorizontal ? `${theme.scale[1000]}px` : 0,
      ...(!isHorizontal && {
        overflowY: 'auto',
        overflowX: 'hidden',
        overscrollBehaviorY: 'contain',
      }),
    },

    '& .step': {
      listStyle: 'none',
      userSelect: 'none',
      flex: isHorizontal ? '1 1 0' : '0 0 auto',
      minWidth: 0,

      '& .stepper-button': {
        cursor: 'pointer',
        display: 'flex',
        flexDirection: isHorizontal ? 'column' : 'row',
        alignItems: isHorizontal ? 'center' : 'flex-start',
        width: '100%',
        padding: 0,
        border: 'none',
        gap: isHorizontal ? `${theme.scale[100]}px` : `${theme.scale[400]}px`,
        backgroundColor: 'transparent',
        ...(!isHorizontal && {
          minHeight: `${isCompact ? theme.scale[1100] : theme.scale[1400]}px`,
        }),

        '&.active, &:disabled': {
          cursor: 'initial',
        },

        '& .stepper-rail': {
          display: 'flex',
          flexDirection: isHorizontal ? 'row' : 'column',
          alignItems: 'center',
          alignSelf: isHorizontal ? 'auto' : 'stretch',
          width: isHorizontal ? '100%' : 'auto',
          gap: `${theme.scale[100]}px`,

          '& .step-marker': {
            ...stepMarker,
          },

          '& .stepper-connector': {
            backgroundColor: theme.palette.border.primary,
            height: isHorizontal ? '1px' : `${theme.scale[600]}px`,
            flex: isHorizontal ? 1 : '1 0 auto',
            width: isHorizontal ? 'auto' : '1px',
            ...(!isHorizontal && {
              minHeight: `${theme.scale[600]}px`,
              transition: isCompact
                ? theme.transitions.create('min-height', {
                    duration: theme.transitions.duration.short,
                  })
                : 'none',

              '&.expanded': {
                minHeight: `${theme.scale[1300]}px`,
              },

              '@media (prefers-reduced-motion: reduce)': {
                transition: 'none',
              },
            }),
          },
        },

        '& .step-label': {
          ...stepLabel,
        },
      },
    },
  }
}
