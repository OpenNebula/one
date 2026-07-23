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
 * @param {boolean} root0.isDisabled - Is disabled
 * @returns {object} - CodeSnippet SX style
 */
export const getStyles = ({ theme, isDisabled }) => {
  const baseStyle = {
    overflow: 'auto',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: `${theme.scale[100]}px`,
    alignSelf: 'stretch',
    minWidth: 0,
    minHeight: 0,

    borderRadius: `${theme.scale[400]}px`,
    border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
    bgcolor: isDisabled ? 'surface.disabled' : 'surface.mute',

    '& > :not(.topbar)': {
      padding: `${theme.scale[400]}px ${theme.scale[500]}px`,
    },
  }

  const topbar = {
    '& .topbar': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      alignSelf: 'stretch',
      gap: `${theme.scale[200]}px`,
      padding: `${theme.scale[300]}px ${theme.scale[400]}px`,
      borderBottom: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,

      '& .title-container': {
        display: 'flex',
        alignItems: 'center',
        flex: '1 1 0',
        minWidth: 0,
      },

      '& .code-snippet-copy-button': {
        display: 'flex',
        flex: '0 0 auto',
        marginLeft: 'auto',
      },
    },
  }

  const codeContainer = {
    '& .code-container': {
      overflow: 'auto',
      display: 'flex',
      flex: '1 1 auto',
      minHeight: 0,
      gap: `${theme.scale[500]}px`,
      alignSelf: 'stretch',
      alignItems: 'flex-start',
      whiteSpace: 'break-spaces',
      wordBreak: 'break-all',
      '> code': {
        color: 'text.body',
      },
    },
  }

  return {
    ...baseStyle,
    ...topbar,
    ...codeContainer,
  }
}
