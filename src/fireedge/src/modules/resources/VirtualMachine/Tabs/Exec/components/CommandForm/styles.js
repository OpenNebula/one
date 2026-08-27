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
 * @param {number} root0.minRows - Minimum number of command rows
 * @returns {object} Command form SX styles
 */
export const getStyles = ({ theme, minRows = 1 }) => {
  const getTextareaMinHeight = (lineHeight) =>
    `calc(${Array(minRows).fill(lineHeight).join(' + ')} + ${
      theme.scale[300] * 2 + theme.borderWidth.sm * 2
    }px)`

  return {
    display: 'flex',
    flexDirection: 'column',
    flex: '1 1 50%',
    alignItems: 'flex-end',
    minHeight: 0,
    maxHeight: 'max-content',
    boxSizing: 'border-box',
    overflow: 'hidden',
    padding: `${theme.scale[400]}px ${theme.scale[500]}px`,
    borderRadius: theme.borderRadius.lg,
    border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,

    '& .exec-form-header': {
      width: '100%',
      display: 'flex',
      justifyContent: 'space-between',
      gap: `${theme.scale[200]}px`,
      paddingBottom: `${theme.scale[200]}px`,
      marginBottom: `${theme.scale[200]}px`,
      borderBottom: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
      flexShrink: 0,
    },

    '& .exec-command-textarea': {
      flex: '1 1 auto',
      minHeight: 0,
      overflow: 'visible',
      marginBottom: `${theme.scale[200]}px`,

      '& .textarea-container': {
        flex: '1 1 auto',
        minHeight: 0,
        overflow: 'visible',
      },

      '& .textarea:not([aria-hidden="true"])': {
        boxSizing: 'border-box',
        minHeight: {
          xs: getTextareaMinHeight(theme.lineHeight.body.sm.mobile),
          sm: getTextareaMinHeight(theme.lineHeight.body.sm.tablet),
          md: getTextareaMinHeight(theme.lineHeight.body.sm.desktop),
        },
        maxHeight: '100%',
        overflowY: 'auto !important',
        fontFamily: 'monospace',
      },

      '& .label': {
        color: 'text.headings',
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
      },
    },

    '& > button': {
      flexShrink: 0,
    },
  }
}
