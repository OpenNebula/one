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
 * @returns {object} - Slot styles
 */
export const getStyles = ({ theme }) => {
  const tagHeight = `${theme.scale[550] + theme.scale[50]}px`

  const baseStyles = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: `${theme.scale[100]}px`,
    alignItems: 'center',
    width: '100%',
    minWidth: 0,
    maxWidth: '100%',
  }

  const tags = {
    '& .MuiButton-root': {
      boxSizing: 'border-box',
      flex: '0 1 auto',
      justifyContent: 'flex-start',
      height: tagHeight,
      minHeight: tagHeight,
      maxHeight: tagHeight,
      maxWidth: '100%',
    },

    '& .tag-title': {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
  }

  return {
    ...baseStyles,
    ...tags,
  }
}
