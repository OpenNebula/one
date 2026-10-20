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
 * @param {object} root0.theme - Current theme
 * @returns {object} - Attributes panel footer styles
 */
export const getFooterStyles = ({ theme }) => {
  const baseStyles = {
    display: 'flex',
    flex: '1 1 0',
    gap: '8px',
    height: '40px',
    alignItems: 'flex-start',
    alignSelf: 'stretch',

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

  return {
    ...baseStyles,
  }
}

/**
 * @param {object} root0 - Params
 * @param {boolean} root0.isEmpty - Whether the attributes table is empty
 * @returns {object} - Attributes table styles
 */
export const getTableStyles = ({ isEmpty = false } = {}) => ({
  '& .table-top-row': {
    position: 'sticky',
    top: 0,
    zIndex: 1,
  },
  '& tbody tr:not(.filler-row):hover': {
    '& .toggle-group-container': {
      display: 'flex',
    },
  },
  ...(isEmpty && {
    '& .table-scroll': {
      minHeight: '112px',
    },
    '& .table-empty-content-inner > *': {
      margin: '0 auto',
    },
  }),
})

/**
 * @param {object} root0 - Params
 * @param {number} root0.depth - Attribute tree depth
 * @param {boolean} root0.isParent - Attribute has children
 * @returns {object} - Attribute key cell styles
 */
export const getKeyStyles = ({ depth = 0, isParent = false } = {}) => ({
  display: 'block',
  pl: `${depth * 16}px`,
  fontWeight: isParent ? 600 : 400,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
})

export const VALUE_CONTAINER_STYLES = {
  display: 'flex',
  flexDirection: 'row',
  width: '100%',
  alignItems: 'center',
  padding: '4px',
}

export const EDIT_CONTAINER_STYLES = {
  ...VALUE_CONTAINER_STYLES,
  gap: '8px',
}

export const EDIT_INPUT_STYLES = {
  flex: '1 1 auto',
  minWidth: 0,
}

export const VALUE_TEXT_STYLES = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  minWidth: 0,
}

export const COLLAPSIBLE_VALUE_TEXT_STYLES = {
  ...VALUE_TEXT_STYLES,
  display: 'block',
  whiteSpace: 'pre-wrap',
  overflowWrap: 'anywhere',
}

/**
 * @param {object} theme - Current theme
 * @returns {object} - Collapsible attribute container styles
 */
export const COLLAPSIBLE_CONTAINER_STYLES = (theme) => ({
  ...VALUE_CONTAINER_STYLES,
  alignItems: 'flex-start',
  boxSizing: 'border-box',
  gap: `${theme.scale[200]}px`,
  minWidth: 0,
})

/**
 * @param {object} theme - Current theme
 * @returns {object} Collapsible attribute text container styles
 */
export const COLLAPSIBLE_TEXT_CONTAINER_STYLES = (theme) => ({
  flex: '1 1 0',
  minWidth: 0,
  py: {
    xs: `max(0px, calc((${theme.scale[700]}px - ${theme.lineHeight.body.sm.mobile}) / 2))`,
    sm: `max(0px, calc((${theme.scale[700]}px - ${theme.lineHeight.body.sm.tablet}) / 2))`,
    md: `max(0px, calc((${theme.scale[700]}px - ${theme.lineHeight.body.sm.desktop}) / 2))`,
  },
})

export const COLLAPSED_VALUE_TEXT_STYLES = {
  display: '-webkit-box',
  WebkitLineClamp: 1,
  WebkitBoxOrient: 'vertical',
}

/**
 * @param {object} theme - Current theme
 * @returns {object} - Collapsible attribute controls styles
 */
export const COLLAPSIBLE_CONTROLS_STYLES = (theme) => ({
  display: 'flex',
  alignItems: 'center',
  flexShrink: 0,
  gap: `${theme.scale[200]}px`,
})

export const COLLAPSIBLE_BUTTON_STYLES = {
  '&:hover': {
    bgcolor: 'transparent',
    borderColor: 'transparent',
  },
}

/**
 * @param {object} theme - Current theme
 * @returns {object} - Attribute row action group styles
 */
export const ACTION_GROUP_STYLES = (theme) => ({
  bgcolor: 'transparent',
  padding: '0px',
  gap: `${theme.scale[100]}px`,
  justifyContent: 'flex-end',
})

/**
 * @param {object} theme - Current theme
 * @returns {object} - Hidden attribute row action group styles
 */
export const HIDDEN_ACTION_GROUP_STYLES = (theme) => ({
  ...ACTION_GROUP_STYLES(theme),
  display: 'none',
})

/**
 * @param {object} theme - Current theme
 * @returns {object} Collapsible attribute row action group styles
 */
export const COLLAPSIBLE_ACTION_GROUP_STYLES = (theme) => ({
  ...HIDDEN_ACTION_GROUP_STYLES(theme),
  flex: '0 0 auto',
  alignSelf: 'center',
  borderRadius: 0,
  pl: `${theme.scale[200]}px`,
})

export const ACTION_STYLES = {
  padding: '0 0 0 8px',
  bgcolor: 'transparent',
  '&:hover': {
    color: 'icon.actionHover',
  },
}

export const DESTRUCTIVE_ACTION_STYLES = {
  ...ACTION_STYLES,
  color: 'text.onDestructive',
  '&:hover': {
    color: 'text.onDestructive',
  },
}

export const CONFIRM_ACTION_STYLES = {
  padding: '0 0 0 8px',
  bgcolor: 'transparent',
}

export const ADD_BUTTON_STYLES = {
  height: '40px',
  width: '40px',
  padding: '8px',
  flex: '0 0 40px',
}
