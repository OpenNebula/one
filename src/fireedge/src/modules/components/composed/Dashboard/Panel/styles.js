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
 * @returns {object} Dashboard panel SX styles
 */
export const getStyles = ({ theme }) => ({
  display: 'flex',
  width: '100%',
  alignItems: 'stretch',
  flexWrap: 'wrap',
  gap: `${theme.scale[500]}px`,
})

const getSizeStyles = ({ theme, size }) => {
  switch (size) {
    case 'quarter':
      return {
        minWidth: { xs: 0, sm: `${theme.scale[1700]}px` },
        flexBasis: {
          xs: '100%',
          sm: `calc(50% - ${theme.scale[200]}px)`,
          lg: `calc(25% - ${theme.scale[400]}px)`,
        },
      }
    case 'third':
      return {
        minWidth: { xs: 0, sm: `${theme.scale[1700]}px` },
        flexBasis: {
          xs: '100%',
          sm: `calc(50% - ${theme.scale[200]}px)`,
          lg: `calc((100% - ${theme.scale[500] * 2}px) / 3)`,
        },
      }
    case 'half':
      return {
        minWidth: { xs: 0, sm: `${theme.scale[1700]}px` },
        flexBasis: {
          xs: '100%',
          sm: `calc(50% - ${theme.scale[200]}px)`,
        },
      }
    case 'wide':
      return {
        minWidth: { xs: 0, md: `${theme.scale[1800]}px` },
        flexBasis: {
          xs: '100%',
          md: `calc(58% - ${theme.scale[200]}px)`,
        },
      }
    case 'narrow':
      return {
        minWidth: { xs: 0, md: `${theme.scale[1700]}px` },
        flexBasis: {
          xs: '100%',
          md: `calc(42% - ${theme.scale[200]}px)`,
        },
      }
    default:
      return {
        minWidth: 0,
        flexBasis: '100%',
      }
  }
}

/**
 * @param {object} root0 - Params
 * @param {object} root0.theme - Current theme in use
 * @param {'quarter'|'third'|'half'|'full'|'wide'|'narrow'} root0.size - Preferred item width
 * @returns {object} Dashboard panel item SX styles
 */
export const getItemStyles = ({ theme, size }) => ({
  display: 'flex',
  flexGrow: 1,
  flexShrink: 1,
  ...getSizeStyles({ theme, size }),

  '& > .dashboard-card': {
    width: '100%',
    height: '100%',
  },
})
