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

const isSmall = (size) => size === 'small'

/**
 * @param {object} root0 - Params
 * @param {object} root0.theme - Current theme in use
 * @param {'small'|'medium'} root0.size - Empty content size
 * @param {'default'|'error'} root0.status - Empty content status
 * @returns {object} - EmptyContent styles
 */
export const getStyles = ({ theme, size = 'medium', status = 'default' }) => ({
  alignItems: 'center',
  display: 'flex',
  flexDirection: isSmall(size) ? 'row' : 'column',
  flexWrap: 'nowrap',
  gap: `${theme.scale[isSmall(size) ? 700 : 600]}px`,
  justifyContent: 'center',
  margin: isSmall(size) ? `${theme.scale[600]}px auto` : '0 auto',
  maxWidth: isSmall(size) ? '640px' : '476px',
  textAlign: isSmall(size) ? 'left' : 'center',
  width: '100%',

  '& .empty-content-illustration': {
    flexShrink: 0,
    height: 'auto',
    maxWidth: '100%',
    width: isSmall(size) ? '168px' : '476px',
  },

  '& .empty-content-card': {
    fill: theme.palette.surface.primary,
    stroke: theme.palette.border.primary,
  },

  '& .empty-content-card-active': {
    fill: theme.palette.surface[status === 'error' ? 'error' : 'primary'],
    stroke: theme.palette.border[status === 'error' ? 'error' : 'action'],
  },

  '& .empty-content-card-muted': {
    fill: theme.palette.surface.primary,
    opacity: 0.64,
    stroke: theme.palette.border.primary,
  },

  '& .empty-content-icon-active': {
    fill: theme.palette.icon[status === 'error' ? 'error' : 'action'],
  },

  '& .empty-content-icon-muted': {
    fill: theme.palette.icon.disabled,
  },

  '& .empty-content-line': {
    stroke: theme.palette.border.primary,
    strokeLinecap: 'round',
    strokeWidth: theme.borderWidth.lg,
  },

  '& .empty-content-pointer': {
    fill: 'none',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    strokeWidth: theme.borderWidth.sm,
  },

  '& .empty-content-pointer-active': {
    stroke: theme.palette.icon[status === 'error' ? 'error' : 'action'],
  },

  '& .empty-content-pointer-muted': {
    stroke: theme.palette.icon.disabled,
  },

  '& .empty-content-body': {
    alignItems: isSmall(size) ? 'flex-start' : 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: `${theme.scale[isSmall(size) ? 500 : 600]}px`,
    flex: isSmall(size) ? '1 1 auto' : 'initial',
    maxWidth: '384px',
    minWidth: 0,
  },

  '& .empty-content-text': {
    alignItems: isSmall(size) ? 'flex-start' : 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: `${theme.scale[100]}px`,
    maxWidth: '384px',
  },

  '& .empty-content-title': {
    color: status === 'error' ? 'text.error' : 'text.headings',
  },

  '& .empty-content-subtitle': {
    color: 'text.body',
  },
})
