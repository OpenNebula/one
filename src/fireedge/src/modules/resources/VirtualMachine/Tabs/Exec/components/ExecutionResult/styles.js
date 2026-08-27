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
 * @returns {object} Execution result SX styles
 */
export const getStyles = ({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  flex: '1 1 50%',
  width: '100%',
  minHeight: 0,
  maxHeight: 'max-content',
  boxSizing: 'border-box',
  overflow: 'hidden',
  outline: 'none',
  borderRadius: theme.borderRadius.lg,
  border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,

  '& .exec-result-header': {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${theme.scale[200]}px ${theme.scale[500]}px`,
    borderBottom: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
    flexShrink: 0,

    '& .exec-result-header-info': {
      display: 'flex',
      flex: 1,
      alignItems: 'center',
      gap: `${theme.scale[200]}px`,
      minWidth: 0,

      '& .command': {
        minWidth: 0,
        maxWidth: '45%',
        color: theme.palette.text.body,
        fontFamily: 'monospace',
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

      '& .exec-return-code, & .exec-time, & .exec-last-checked': {
        marginTop: `${theme.scale[50]}px`,
        color: theme.palette.text.body,
        fontSize: {
          xs: theme.fontSize.body.caption.mobile,
          sm: theme.fontSize.body.caption.tablet,
          md: theme.fontSize.body.caption.desktop,
        },
        lineHeight: {
          xs: theme.lineHeight.body.caption.mobile,
          sm: theme.lineHeight.body.caption.tablet,
          md: theme.lineHeight.body.caption.desktop,
        },
      },

      '& .exec-return-code::before, & .exec-time::before, & .exec-last-checked::before':
        {
          content: '"· "',
        },
    },

    '& .exec-result-header-actions': {
      display: 'flex',
      flexShrink: 0,
      gap: `${theme.scale[100]}px`,
    },
  },

  '& .exec-result-output': {
    flex: '0 1 auto',
    margin: 0,
    minHeight: '200px',
    minWidth: 0,
    maxWidth: '100%',
    boxSizing: 'border-box',
    overflowX: 'hidden',
    overflowY: 'auto',
    whiteSpace: 'pre-wrap',
    overflowWrap: 'anywhere',
    backgroundColor: theme.palette.surface.mute,
    padding: `${theme.scale[400]}px ${theme.scale[500]}px`,

    '&.no-output': {
      alignItems: 'center',
      justifyContent: 'center',
      display: 'flex',
      color: theme.palette.text.disabled,

      '& .no-output-text': {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        maxWidth: '80%',
        minWidth: 0,
        gap: `${theme.scale[200]}px`,
        textAlign: 'center',
      },
    },
  },
})
