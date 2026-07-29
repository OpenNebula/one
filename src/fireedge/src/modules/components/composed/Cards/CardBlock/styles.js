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
 * @param {boolean} root0.hasActions - Card has actions
 * @param {boolean} root0.isSelected - Selected
 * @param {boolean} root0.isSelectable - Card can be selected
 * @returns {object} - CardBlock styles
 */
export const getStyles = ({ theme, hasActions, isSelected, isSelectable }) => {
  const borderColor = isSelected
    ? theme.palette.border.focus2
    : theme.palette.border.primary

  return {
    border: `${theme.borderWidth.sm}px solid ${borderColor}`,
    borderLeft: `${theme.borderWidth.sm}px solid ${borderColor}`,
    borderRadius: `${theme.borderRadius['2xl']}px`,
    boxSizing: 'border-box',
    height: '100%',
    ...(hasActions && {
      paddingRight: `${theme.scale[1200]}px`,
    }),
    ...(!isSelectable && {
      '&:hover': {
        bgcolor: isSelected ? 'surface.focus2' : 'surface.primary',
        cursor: 'default',
      },
    }),
    bgcolor: 'surface.primary',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  }
}

/**
 * @param {object} root0 - Params
 * @param {object} root0.theme - Current theme in use
 * @returns {object} - CardBlock wrapper styles
 */
export const getWrapperStyles = ({ theme }) => ({
  display: 'flex',
  height: '100%',
  position: 'relative',
  width: '100%',

  '& .card-block-actions': {
    alignItems: 'center',
    display: 'flex',
    position: 'absolute',
    right: `${theme.scale[300]}px`,
    top: `${theme.scale[300]}px`,
    zIndex: 1,
  },
})
