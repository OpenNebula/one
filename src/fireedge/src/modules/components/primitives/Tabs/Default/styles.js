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

const getLabelColorStyles = (titleColor, iconColor = titleColor) => ({
  '& .tab-label': {
    '& .tab-title': {
      color: titleColor,
    },

    '& .tab-starticon, & .tab-endicon': {
      color: iconColor,
    },
  },
})

const getLayoutMetrics = ({ theme, type }) => {
  const isDefault = type === 'default'
  const indicatorHeight = isDefault ? 0 : theme.borderWidth.md
  const focusOffset = theme.scale[50]
  const focusBlockOffset = isDefault
    ? focusOffset + theme.borderWidth.sm
    : focusOffset + indicatorHeight / 2
  const focusInlineOffset = isDefault ? focusBlockOffset : focusOffset

  return {
    indicatorHeight,
    basePadding:
      focusOffset + (isDefault ? theme.borderWidth.none : theme.borderWidth.sm),
    tabBarRadius: theme.borderRadius.xlg - focusOffset,
    focusInset: `-${focusBlockOffset}px -${focusInlineOffset}px`,
    focusTranslateY: indicatorHeight / 2,
    focusRadius:
      theme.borderRadius.xlg + (isDefault ? theme.borderWidth.sm : 0),
  }
}

const getDefaultModifiers = (theme) => ({
  base: {
    borderRadius: `${theme.borderRadius.xlg + theme.scale[50]}px`,
    border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
  },
  tab: {
    borderRadius: `${theme.borderRadius.xlg}px`,
    border: `${theme.borderWidth.sm}px solid transparent`,

    '&.Mui-selected': {
      bgcolor: theme.palette.surface.action,
      border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,

      ...getLabelColorStyles(
        theme.palette.text.onAction3,
        theme.palette.icon.onAction3
      ),

      '&:hover': {
        borderColor: theme.palette.border.actionHover2,
        bgcolor: theme.palette.surface.actionHover3,

        ...getLabelColorStyles(theme.palette.text.actionHover),
      },

      '&:active': {
        bgcolor: theme.palette.surface.primary,
        borderColor: theme.palette.border.focus2,

        ...getLabelColorStyles(
          theme.palette.text.focus,
          theme.palette.icon.focus
        ),
      },

      '&.Mui-disabled': {
        bgcolor: 'transparent',
        border: `${theme.borderWidth.sm}px solid transparent`,

        ...getLabelColorStyles(
          theme.palette.text.onDisabled,
          theme.palette.icon.onDisabled
        ),
      },
    },

    '&:hover': {
      borderColor: theme.palette.surface.actionHover3,
      bgcolor: theme.palette.surface.actionHover2,

      ...getLabelColorStyles(
        theme.palette.text.actionHover2,
        theme.palette.icon.actionHover
      ),
    },

    '&:active': {
      borderColor: theme.palette.border.primary,
    },
  },
})

const getLineModifiers = (theme) => ({
  base: {
    borderRadius: `${theme.borderRadius.xlg + theme.borderWidth.sm}px`,
  },
  tab: {
    borderRadius: `${theme.borderRadius.xlg - theme.borderWidth.sm}px ${
      theme.borderRadius.xlg - theme.borderWidth.sm
    }px 0 0`,
    borderBottom: `${theme.borderWidth.md}px solid ${theme.palette.border.primary}`,
    padding: `${theme.scale[100]}px ${theme.scale[500]}px ${
      theme.borderWidth.lg - theme.borderWidth.md
    }px`,

    '&.Mui-selected': {
      ...getLabelColorStyles(
        theme.palette.text.action,
        theme.palette.icon.action
      ),

      '&:hover': {
        ...getLabelColorStyles(theme.palette.text.actionHover),
      },
    },

    '&.Mui-disabled': {
      backgroundColor: 'transparent',
    },
  },
})

const getTypeModifiers = ({ theme, type }) =>
  type === 'line' ? getLineModifiers(theme) : getDefaultModifiers(theme)

const getMuiOverrides = ({
  theme,
  type,
  indicatorMoving,
  basePadding,
  indicatorHeight,
}) => ({
  '& .MuiTabs-root': {
    position: 'relative',
  },

  '& .MuiTabs-scrollButtons': {
    zIndex: 5,
    margin: `0 ${theme.scale[50]}px`,
    border: `${theme.borderWidth.sm}px solid transparent`,
    borderRadius: '0',
    position: 'absolute',
    top: 0,
    bottom: 0,
    height: 'auto',
    opacity: 1,
    boxSizing: 'initial',
    color: theme.palette.icon.action,
    transition: 'opacity 0.3s ease',

    '&:hover': {
      margin: `${theme.scale[50]}px`,
    },
  },

  '& .MuiTabs-scrollButtons:first-of-type': {
    left: 0,
    background: `linear-gradient(90deg, ${theme.palette.surface.primary}, ${theme.palette.surface.primary} 50%, transparent 100%)`,
    boxShadow: `-${theme.scale[300]}px 0 0 ${theme.palette.surface.primary}`,
    borderLeft: `${theme.borderWidth.sm}px solid ${theme.palette.surface.primary}`,
    borderRight: 'none',

    '&:hover': {
      borderRadius: `${theme.borderRadius.xlg}px`,
      borderColor: theme.palette.border.actionHover2,
      borderRight: `${theme.borderWidth.sm}px solid ${theme.palette.border.actionHover2}`,
      background: theme.palette.surface.actionHover2,
    },
  },

  '& .MuiTabs-scrollButtons:last-of-type': {
    right: 0,
    background: `linear-gradient(90deg, transparent, ${theme.palette.surface.primary} 50%, ${theme.palette.surface.primary} 100%)`,
    boxShadow: `${theme.scale[300]}px 0 0 ${theme.palette.surface.primary}`,
    borderRight: `${theme.borderWidth.sm}px solid ${theme.palette.surface.primary}`,
    borderLeft: 'none',

    '&:hover': {
      borderRadius: `${theme.borderRadius.xlg}px`,
      borderColor: theme.palette.border.actionHover2,
      borderLeft: `${theme.borderWidth.sm}px solid ${theme.palette.border.actionHover2}`,
      background: theme.palette.surface.actionHover2,
    },
  },

  '& .MuiTabs-flexContainer': {
    boxSizing: 'border-box',
    width: 'max-content',
    minWidth: '100%',
    padding: `${basePadding}px`,
  },

  '& .MuiTabs-indicator': {
    zIndex: 3,
    display: type === 'line' ? 'block' : 'none',
    bottom: `${basePadding}px`,
    height: `${indicatorHeight}px`,
    backgroundColor: theme.palette.border.action,
  },

  '& .MuiTab-root': {
    textTransform: 'none !important',
  },

  '&:has(.Mui-selected.Mui-disabled) .MuiTabs-indicator': {
    backgroundColor: theme.palette.border.primary,
  },

  ...(!indicatorMoving && {
    '&:has(.Mui-selected:hover) .MuiTabs-indicator': {
      height: `${indicatorHeight + theme.scale[50]}px`,
      backgroundColor: theme.palette.border.actionHover2,
    },
  }),
})

const getTabLabelStyles = (theme) => ({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: '7px',

  '& .tab-starticon, & .tab-endicon': {
    width: `${theme.scale[500]}px`,
    height: `${theme.scale[500]}px`,
    strokeWidth: theme.borderWidth.md,
    color: theme.palette.icon.action,
  },

  '& .tab-title': {
    display: 'inline-grid',
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

    '&::after': {
      content: 'attr(data-text)',
      gridArea: '1 / 1',
      fontWeight: 600,
      height: 0,
      visibility: 'hidden',
      overflow: 'hidden',
      userSelect: 'none',
      pointerEvents: 'none',
    },
  },
})

const getFocusStyles = ({
  theme,
  focusInset,
  focusTranslateY,
  focusRadius,
}) => ({
  zIndex: 2,

  '&::after': {
    content: '""',
    position: 'absolute',
    inset: focusInset,
    transform: `translateY(${focusTranslateY}px)`,
    boxSizing: 'border-box',
    border: `${theme.borderWidth.sm}px solid ${theme.palette.border.focus2}`,
    borderRadius: `${focusRadius}px`,
    pointerEvents: 'none',
  },
})

const getTabStyles = ({ theme, focusStyles, tabModifiers }) => ({
  overflow: 'visible',
  outline: 'none',
  display: 'inline-flex',
  padding: `${theme.scale[100]}px ${theme.scale[500]}px`,
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: 'unset',
  maxWidth: 'unset',
  color: 'text.body',

  '& .tab-label': getTabLabelStyles(theme),

  // Unselected hover
  '&:hover': {
    backgroundColor: 'surface.actionHover2',
    color: 'text.actionHover2',

    ...getLabelColorStyles(
      theme.palette.text.actionHover2,
      theme.palette.icon.actionHover
    ),
  },

  // Unselected focus
  '&:active': {
    backgroundColor: 'transparent',
    ...focusStyles,

    ...getLabelColorStyles(theme.palette.text.body, theme.palette.icon.focus),
  },

  // Unselected disabled
  '&.Mui-disabled': {
    ...getLabelColorStyles(
      theme.palette.text.disabled,
      theme.palette.icon.onDisabled
    ),
  },

  // Selected
  '&.Mui-selected': {
    backgroundColor: 'surface.primary',

    '& .tab-title': {
      fontWeight: 600,
    },

    // Selected hover
    '&:hover': {
      backgroundColor: theme.palette.surface.actionHover3,
      color: theme.palette.text.actionHover,

      '& .tab-label .tab-title': {
        color: theme.palette.text.actionHover,
      },
    },

    // Selected focus
    '&:active': {
      backgroundColor: 'transparent',

      ...getLabelColorStyles(
        theme.palette.text.focus,
        theme.palette.icon.focus
      ),
    },

    // Selected disabled
    '&.Mui-disabled': {
      '& .tab-label': {
        '& .tab-title': {
          color: theme.palette.text.onDisabled,
        },
      },
    },
  },

  '&.tab-modifiers': tabModifiers,
})

/**
 * @param {object} root0 - Params
 * @param {object} root0.theme - Current theme in use
 * @param {string} root0.type - Tab type
 * @param {boolean} root0.indicatorMoving - Whether the indicator is moving
 * @returns {object} - Tab SX style
 */
export const getStyles = ({ theme, type, indicatorMoving = false }) => {
  const layoutMetrics = getLayoutMetrics({ theme, type })
  const { base: baseModifiers, tab: tabModifiers } = getTypeModifiers({
    theme,
    type,
  })
  const focusStyles = getFocusStyles({ theme, ...layoutMetrics })
  const tabStyles = getTabStyles({ theme, focusStyles, tabModifiers })

  return {
    width: '100%',
    minWidth: 0,
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    bgcolor: theme.palette.surface.primary,

    '& .tabbar': {
      width: '100%',
      minWidth: 0,
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      minHeight: 'unset',
      borderRadius: `${layoutMetrics.tabBarRadius}px`,

      '& .tab': tabStyles,
    },

    ...getMuiOverrides({
      theme,
      type,
      indicatorMoving,
      ...layoutMetrics,
    }),

    '&.base-modifiers': baseModifiers,
  }
}
