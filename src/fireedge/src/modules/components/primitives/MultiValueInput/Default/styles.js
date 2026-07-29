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
 * @returns {object} - Multi value input styles
 */
export const getStyles = ({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  gap: `${theme.scale[400]}px`,
  width: '100%',
  minWidth: 0,

  '& .multivalue-tags': {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: `${theme.scale[100]}px`,
    padding: `${theme.scale[400]}px ${theme.scale[500]}px`,
    borderRadius: `${theme.borderRadius['3xl']}px`,
    bgcolor: 'surface.mute',
    border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
  },

  '& .multivalue-chip': {
    display: 'flex',
    alignItems: 'center',
    gap: `${theme.scale[100]}px`,
    padding: `${theme.scale[50]}px ${theme.scale[200]}px`,
    border: `${theme.borderWidth.sm}px solid ${theme.palette.border.action}`,
    borderRadius: `${theme.borderRadius['2xl']}px`,
    bgcolor: 'surface.action',

    '&.marked': {
      bgcolor: 'surface.error',
      color: 'text.error',
      borderColor: 'border.error',
    },

    '& .label': {
      minWidth: 0,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      color: 'text.onAction',
      fontSize: {
        xs: theme.fontSize.body.caption.mobile,
        sm: theme.fontSize.body.caption.tablet,
        md: theme.fontSize.body.caption.desktop,
      },
      fontWeight: {
        xs: 600,
        sm: 600,
        md: 600,
      },
      lineHeight: {
        xs: theme.lineHeight.body.caption.mobile,
        sm: theme.lineHeight.body.caption.tablet,
        md: theme.lineHeight.body.caption.desktop,
      },
    },

    '& .remove': {
      appearance: 'none',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 0,
      border: 0,
      borderRadius: `${theme.borderRadius.xlg}px`,
      color: 'text.onAction',
      backgroundColor: 'transparent',
      cursor: 'pointer',
      width: `${theme.scale[500]}px`,
      height: `${theme.scale[500]}px`,

      '& svg': {
        strokeWidth: 1.6,
        width: `${theme.scale[500]}px`,
        height: `${theme.scale[500]}px`,
      },

      '&:hover': {
        bgcolor: 'surface.actionHover',
      },

      '&:focus-visible': {
        outline: `${theme.borderWidth.md}px solid ${theme.palette.border.focus}`,
        outlineOffset: '2px',
      },
    },
  },
})
