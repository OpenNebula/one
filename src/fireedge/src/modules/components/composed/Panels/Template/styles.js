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
 * @returns {object} - Templates tab SX style
 */
export const getStyles = ({ theme }) => {
  const baseStyle = {
    display: 'flex',
    flex: '1 1 0',
    flexDirection: 'column',
    width: '100%',
    minWidth: 0,
    minHeight: 0,
    padding: `${theme.scale[200]}px`,
    alignItems: 'stretch',
    gap: `${theme.scale[200]}px`,
    overflow: 'hidden',

    borderRadius: `${theme.borderRadius?.['4xl']}px`,
    border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
    bgcolor: 'surface.primary',

    '& > *': {
      flex: '1 1 0',
      width: '100%',
      minWidth: 0,
      minHeight: 0,
    },
  }

  return {
    ...baseStyle,
  }
}
