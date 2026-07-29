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
 * @returns {object} - Comments tab SX style
 */
export const getStyles = ({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: `${theme.scale[400]}px`,
  width: '100%',
  minWidth: 0,
  minHeight: 'fit-content',
  overflow: 'visible',

  '& .comments-list': {
    display: 'flex',
    flex: '0 0 auto',
    flexDirection: 'column',
    gap: `${theme.scale[300]}px`,
    width: '100%',
    minHeight: 'fit-content',
    overflow: 'visible',
    paddingRight: `${theme.scale[100]}px`,
  },

  '& .comment-bubble': {
    display: 'flex',
    flexDirection: 'column',
    alignSelf: 'flex-start',
    gap: `${theme.scale[250]}px`,
    maxWidth: '80%',
    minWidth: 0,
    padding: `${theme.scale[400]}px`,
    borderRadius: `${theme.borderRadius['3xl']}px`,
    border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
    bgcolor: 'surface.secondary',
    color: 'text.body',

    '&.comment-bubble--requester': {
      alignSelf: 'flex-end',
      bgcolor: 'surface.information',
      borderColor: 'border.information',
    },

    '& pre': {
      overflowX: 'auto',
      maxWidth: '100%',
      padding: `${theme.scale[200]}px`,
      borderRadius: `${theme.borderRadius.lg}px`,
      bgcolor: 'surface.primary',
    },

    '& p': {
      margin: 0,
    },
  },

  '& .comment-author': {
    display: 'flex',
    alignItems: 'center',
    gap: `${theme.scale[200]}px`,
    minWidth: 0,
  },

  '& .comment-author-avatar': {
    width: '24px',
    height: '24px',
    flex: '0 0 auto',
  },

  '& .comment-body': {
    minWidth: 0,
    overflowWrap: 'anywhere',
  },

  '& .comment-date': {
    alignSelf: 'flex-end',
    color: 'text.body',
  },

  '& .attachments': {
    display: 'flex',
    flexDirection: 'column',
    gap: `${theme.scale[100]}px`,
    minWidth: 0,
  },

  '& .attachments-title': {
    display: 'flex',
    alignItems: 'center',
    gap: `${theme.scale[100]}px`,
    color: 'text.body',
  },

  '& .attachments-list': {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: `${theme.scale[100]}px`,
    minWidth: 0,
  },

  '& .comment-form': {
    display: 'flex',
    flex: '0 0 auto',
    flexDirection: 'column',
    width: '100%',
    minWidth: 0,
    paddingBottom: `${theme.scale[300]}px`,
    borderBottom: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
  },

  '& .comment-form .textarea-container': {
    minWidth: 0,
  },

  '& .comment-form .textarea': {
    boxSizing: 'border-box',

    '&:focus': {
      outline: 'none !important',
      borderColor: `${theme.palette.border.focus2} !important`,
      boxShadow: `inset 0 0 0 ${theme.borderWidth.md}px ${theme.palette.border.focus2} !important`,
    },
  },

  '& .comment-actions': {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: `${theme.scale[300]}px`,
    flexWrap: 'wrap',
    paddingTop: `${theme.scale[300]}px`,
  },

  '& .comment-upload': {
    display: 'flex',
    alignItems: 'center',
    gap: `${theme.scale[200]}px`,
    flex: '1 1 auto',
    flexWrap: 'wrap',
    minWidth: 0,
  },

  '& .comment-upload-input': {
    display: 'none',
  },

  '& .comment-upload-filename': {
    minWidth: 0,
    maxWidth: 'min(360px, 45vw)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: 'text.body',
  },

  '& .comment-upload-error': {
    flexBasis: '100%',
    color: 'error.main',
  },

  '& .comment-submit': {
    display: 'flex',
    flex: '0 0 auto',
    justifyContent: 'flex-end',
  },
})
