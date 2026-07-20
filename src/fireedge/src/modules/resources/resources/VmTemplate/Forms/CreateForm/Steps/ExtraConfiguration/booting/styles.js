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
/* eslint-disable jsdoc/require-jsdoc */
import { css } from '@emotion/css'

const useStyles = (theme) => ({
  root: css({
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gridTemplateRows: 'auto',
    gap: `${theme.scale[600]}px`,
    overflow: 'auto',
    [theme.breakpoints.down('sm')]: {
      gridTemplateColumns: '1fr',
    },
  }),
  'os-cpu-model': css({
    gridColumn: '1 / span 2',
    // gridRow: '1',
    padding: theme.spacing(1),
    [theme.breakpoints.down('sm')]: {
      gridColumn: '1 / -1',
    },
  }),
  'os-raw': css({
    gridColumn: '1 / span 2',
    // gridRow: '1',
    padding: theme.spacing(1),
    [theme.breakpoints.down('sm')]: {
      gridColumn: '1 / -1',
    },
  }),
})

/**
 * @param {object} root0 - Params
 * @param {object} root0.theme - Current theme
 * @returns {object} Boot order styles
 */
export const getBootOrderStyles = ({ theme }) => ({
  width: '100%',

  '& .boot-order-droppable': {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    marginBottom: `-${theme.scale[200]}px`,
  },

  '& .boot-order-item': {
    display: 'flex',
    alignItems: 'center',
    gap: `${theme.scale[300]}px`,
    minWidth: 0,
    minHeight: `${theme.scale[1100]}px`,
    marginBottom: `${theme.scale[200]}px`,
    padding: `${theme.scale[400]}px ${theme.scale[500]}px`,
    backgroundColor: 'surface.primary',
    border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
    borderRadius: `${theme.borderRadius.xlg}px`,
    cursor: 'grab',
    touchAction: 'none',
    userSelect: 'none',
    willChange: 'transform',

    '&:active': {
      cursor: 'grabbing',
    },

    '&:hover': {
      backgroundColor: 'surface.actionHover4',
      borderColor: 'border.actionHover',
    },

    '&.boot-order-item-selected': {
      backgroundColor: 'surface.focus2',
      borderColor: 'border.actionHover',
    },

    '&.boot-order-item-dragging': {
      backgroundColor: 'surface.primary',
      borderColor: 'border.action',
    },
  },

  '& .boot-order-drag-handle': {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: `${theme.scale[600]}px`,
    height: `${theme.scale[600]}px`,
    color: 'icon.primary',
    cursor: 'grab',
    touchAction: 'none',

    '&:active': {
      cursor: 'grabbing',
    },

    '&:focus-visible': {
      borderRadius: `${theme.borderRadius.md}px`,
      outline: `${theme.borderWidth.sm}px solid ${theme.palette.border.focus}`,
      outlineOffset: `${theme.scale[50]}px`,
    },

    '& svg': {
      width: `${theme.scale[550]}px`,
      height: `${theme.scale[550]}px`,
      strokeWidth: 1.6,
    },
  },

  '& .boot-order-checkbox': {
    flexShrink: 0,
  },

  '& .boot-order-resource': {
    display: 'flex',
    alignItems: 'center',
    gap: `${theme.scale[200]}px`,
    flex: '1 1 auto',
    minWidth: 0,
  },

  '& .boot-order-resource-icon': {
    flexShrink: 0,
    width: `${theme.scale[600]}px`,
    height: `${theme.scale[600]}px`,
    color: 'icon.primary',
    strokeWidth: 1.6,
  },

  '& .boot-order-resource-name': {
    minWidth: 0,
    overflow: 'hidden',
    color: 'text.body',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
})

export default useStyles
