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
 * @returns {object} - Menu Button SX style
 */
export const getStyles = ({ theme }) => ({
  '& .MuiPaper-root': {
    display: 'flex',
    minWidth: '220px',
    width: 'max-content',
    maxWidth: 'none',
    maxHeight: 'none',
    overflow: 'hidden',
    flexDirection: 'column',
    alignItems: 'stretch',

    borderRadius: `${theme.borderRadius.xlg}px`,
    border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
    bgcolor: 'surface.primary',
    boxShadow:
      '0 6px 12px -6px rgba(0, 0, 0, 0.18), 0 14px 24px -18px rgba(0, 0, 0, 0.24)',

    '& .MuiMenu-list': {
      display: 'grid',
      gridAutoFlow: 'row',
      alignSelf: 'stretch',
      minWidth: '220px',
      flex: '1 1 auto',
      width: 'max-content',
      maxHeight: 'none',
      paddingTop: 0,
      paddingBottom: 0,
      overflow: 'hidden',
    },

    '& .menu-button-option': {
      display: 'flex',
      padding: `${theme.scale[150]}px ${theme.scale[200]}px ${theme.scale[150]}px ${theme.scale[300]}px`,
      alignItems: 'center',
      gap: `${theme.scale[200]}px`,
      alignSelf: 'stretch',
      flex: '0 0 auto',
      minWidth: 'max-content',
      width: '100%',
      whiteSpace: 'nowrap',
      boxSizing: 'border-box',
      cursor: 'pointer',

      color: 'text.body',
      bgcolor: 'surface.primary',
      '&:hover': {
        color: 'text.actionHover2',
        bgcolor: 'surface.actionHover4',
      },

      '& .menu-button-option-label': {
        minWidth: 'max-content',
        flex: '1 1 auto',
      },

      '& .option-starticon': {
        width: '16px',
        height: '16px',
        flex: '0 0 16px',
      },
    },

    '& .menu-button-option.selected': {
      color: 'text.selected',
      bgcolor: 'surface.focus',
    },

    '& .menu-button-option.disabled': {
      pointerEvents: 'none',
      cursor: 'not-allowed',
      color: 'text.onDisabled',
      bgcolor: 'surface.disabled',
    },

    '& .menu-button-option.destructive': {
      color: 'text.onDestructive',
    },

    '& .menu-group-divider': {
      margin: `${theme.scale[100]}px 0 ${theme.scale[100]}px ${theme.scale[100]}px`,
    },
  },
})
