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
 * @param {boolean} root0.wrap - Whether tags should wrap
 * @returns {object} - Tag SX style
 */
export const getStyles = ({ theme, wrap = false }) => {
  const baseStyle = {
    display: 'flex',
    flexWrap: wrap ? 'wrap' : 'nowrap',
    alignItems: 'center',
    gap: 0.5,
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
    ...baseStyle,
    ...(wrap && {
      maxWidth: '100%',
      '& .MuiButton-root': {
        maxWidth: '100%',
        height: 'auto',
        whiteSpace: 'normal',
        overflowWrap: 'anywhere',
        wordBreak: 'break-word',
      },
      '& .tag-title': {
        whiteSpace: 'normal',
      },
    }),
  }
}
/* eslint-disable jsdoc/require-jsdoc */
export const getPopupStyles = () => {
  const baseStyle = {
    display: 'inline-flex',
    flexDirection: 'column',
    gap: 0.5,
    alignItems: 'flex-start',
    width: 'fit-content',
    maxWidth: {
      xs: 'calc(100vw - 32px)',
      sm: '360px',
    },
    maxHeight: '320px',
    overflowY: 'auto',

    '& .MuiButton-root': {
      justifyContent: 'flex-start',
      width: 'fit-content',
      maxWidth: {
        xs: 'calc(100vw - 64px)',
        sm: '360px',
      },
      whiteSpace: 'normal',
      overflowWrap: 'anywhere',
      wordBreak: 'break-word',
      textAlign: 'left',
    },
    '& .tag-title': {
      whiteSpace: 'normal',
    },
  }

  return {
    ...baseStyle,
  }
}
