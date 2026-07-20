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
 * @returns {object} - Accounting tab SX style
 */
export const getStyles = ({ theme }) => ({
  display: 'flex',
  width: '100%',
  flex: '1 1 auto',
  height: '100%',
  minHeight: 0,
  boxSizing: 'border-box',
  flexDirection: 'column',
  alignItems: 'stretch',
  gap: `${theme.scale[400]}px`,
  padding: `${theme.scale[200]}px`,
  overflow: 'auto',

  borderRadius: `${theme.borderRadius?.['4xl']}px`,
  border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
  bgcolor: 'surface.primary',

  '& .accounting-toolbar': {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: `${theme.scale[400]}px`,
  },

  '& .accounting-toolbar-group': {
    display: 'flex',
    flexWrap: 'no-wrap',
    alignItems: 'flex-end',
    gap: `${theme.scale[300]}px`,
  },

  '& .accounting-add-dataset-action': {
    display: 'inline-flex',
    height: `calc(${theme.lineHeight.body.sm.desktop} + ${
      theme.scale[300] * 2 + theme.borderWidth.sm * 2
    }px)`,
    flexShrink: 0,
    alignItems: 'center',
  },

  '& .accounting-select': {
    minWidth: 160,
  },

  '& .accounting-metrics': {
    display: 'flex',
    flexDirection: 'column',
    gap: `${theme.scale[200]}px`,
  },

  '& .accounting-datasets': {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: `${theme.scale[200]}px`,
    minHeight: `${theme.scale[600]}px`,
  },

  '& .accounting-dataset-chip': {
    borderRadius: `${theme.borderRadius.xlg}px`,
    border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
    bgcolor: 'surface.secondary',
    color: 'text.body',

    '& .MuiChip-deleteIcon': {
      color: 'text.headings',

      '&:hover': {
        color: 'text.headings',
      },
    },

    '&:hover': {
      bgcolor: 'surface.actionHover2',
    },
  },

  '& .accounting-chart': {
    display: 'flex',
    flex: '1 1 520px',
    minHeight: 360,
    width: '100%',
    position: 'relative',
  },

  '& .accounting-chart > *': {
    flex: '1 1 auto',
    minHeight: 0,
  },
})
