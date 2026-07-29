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
/* eslint-disable jsdoc/require-param-description, jsdoc/require-param-type, jsdoc/require-returns */

const getSearchFieldStyles = (theme, className) => ({
  [`& .${className} .textfield-input-wrapper`]: {
    boxSizing: 'border-box',
    height: `${theme.scale[800]}px`,
    minHeight: `${theme.scale[800]}px`,
    padding: `${theme.scale[300]}px ${theme.scale[400]}px`,
    gap: `${theme.scale[200]}px`,
  },
  [`& .${className} .textfield-input`]: {
    padding: 0,
  },
  [`& .${className} .textfield-adornment-start`]: {
    height: 'auto',
    padding: 0,
  },
})

const getLabelDotStyles = (theme) => ({
  width: `${theme.scale[200]}px`,
  height: `${theme.scale[200]}px`,
  flexShrink: 0,
  borderRadius: '50%',
  bgcolor: 'surface.action',
})

/**
 * @param theme
 */
export const getPanelStyles = (theme) => ({
  '& .MuiPaper-root': {
    width: 'min(352px, calc(100vw - 32px))',
    maxWidth: 'none',
    maxHeight: 'min(560px, calc(100vh - 32px))',
    '& .MuiMenu-list': {
      display: 'block',
      minWidth: 0,
      width: '100%',
      maxHeight: 'none',
      padding: 0,
    },
  },

  '& .label-panel-content': {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    maxHeight: 'min(560px, calc(100vh - 32px))',
    gap: `${theme.scale[300]}px`,
    padding: `${theme.scale[400]}px`,
    boxSizing: 'border-box',
    color: 'text.body',
  },

  '& .label-panel-title': {
    color: 'text.headings',
    fontSize: theme.fontSize.body.md.desktop,
    fontWeight: 600,
    lineHeight: theme.lineHeight.body.md.desktop,
  },

  '& .label-panel-divider': {
    borderColor: 'border.primary',
  },

  ...getSearchFieldStyles(theme, 'label-panel-search'),

  '& .label-panel-tree': {
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    overflowY: 'auto',
    margin: `0 -${theme.scale[100]}px`,
    padding: `0 ${theme.scale[100]}px`,
  },

  '& .label-panel-section': {
    display: 'flex',
    flexDirection: 'column',
    gap: `${theme.scale[100]}px`,
  },

  '& .label-panel-section + .label-panel-section': {
    marginTop: `${theme.scale[300]}px`,
  },

  '& .label-panel-section-title': {
    color: 'text.body',
    fontSize: theme.fontSize.body.sm.desktop,
    fontWeight: 500,
    lineHeight: theme.lineHeight.body.sm.desktop,
  },

  '& .label-panel-row': {
    display: 'flex',
    alignItems: 'center',
    minHeight: `${theme.scale[700]}px`,
    gap: `${theme.scale[200]}px`,
    borderRadius: `${theme.borderRadius.md}px`,
  },

  '& .label-panel-row:hover': {
    bgcolor: 'surface.actionHover2',
  },

  '& .label-panel-checkbox': {
    flexShrink: 0,
    '& .checkbox-container': { margin: 0 },
  },

  '& .label-panel-label': {
    display: 'flex',
    minWidth: 0,
    alignItems: 'center',
    gap: `${theme.scale[200]}px`,
    color: 'text.body',
    fontSize: theme.fontSize.body.sm.desktop,
    lineHeight: theme.lineHeight.body.sm.desktop,
  },

  '& .label-panel-dot': {
    ...getLabelDotStyles(theme),
  },

  '& .label-panel-label-text': {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  '& .label-panel-empty': {
    padding: `${theme.scale[300]}px 0`,
    color: 'text.disabled',
    fontSize: theme.fontSize.body.sm.desktop,
  },

  '& .label-panel-pending': {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: `${theme.scale[200]}px`,
    margin: `${theme.scale[100]}px -${theme.scale[200]}px 0`,
    padding: `${theme.scale[200]}px ${theme.scale[300]}px`,
    bgcolor: 'surface.actionHover4',
  },

  '& .label-panel-pending-count': {
    color: 'text.body',
    fontSize: theme.fontSize.body.sm.desktop,
  },

  '& .label-panel-pending-actions': {
    display: 'flex',
    gap: `${theme.scale[200]}px`,
  },

  '& .label-panel-actions': {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingTop: `${theme.scale[200]}px`,
    borderTop: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
  },

  '& .label-panel-action': {
    justifyContent: 'flex-start',
  },
})

/**
 * @param theme
 */
export const getDialogContentStyles = (theme) => ({
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,

  '& .label-dialog-header': {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: `${theme.scale[400]}px`,
  },

  '& .label-dialog-heading': {
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
  },

  '& .label-dialog-title': {
    color: 'text.headings',
    fontSize: theme.fontSize.heading.h6.desktop,
    fontWeight: theme.fontWeight.heading.h6.desktop,
    lineHeight: theme.lineHeight.heading.h6.desktop,
    marginBottom: `${theme.scale[500]}px`,
  },

  '& .label-dialog-description': {
    color: 'text.body',
    fontSize: theme.fontSize.body.sm.desktop,
    lineHeight: theme.lineHeight.body.sm.desktop,
  },

  '& .label-dialog-body': {
    display: 'flex',
    flexDirection: 'column',
    gap: `${theme.scale[500]}px`,
    minHeight: 0,
    padding: `${theme.scale[500]}px 0`,
    overflowY: 'auto',
  },

  '& .label-dialog-actions': {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: `${theme.scale[300]}px`,
  },

  '& .label-dialog-actions.with-border': {
    paddingTop: `${theme.scale[400]}px`,
    borderTop: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
  },
})

/**
 * @param theme
 */
export const getCreateFormStyles = (theme) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: `${theme.scale[500]}px`,

  '& .label-form-nest': {
    width: 'fit-content',
  },

  '& .label-form-visibility': {
    display: 'flex',
    flexDirection: 'column',
    gap: `${theme.scale[200]}px`,
  },

  '& .label-form-visibility-title': {
    color: 'text.headings',
    fontSize: theme.fontSize.body.sm.desktop,
    fontWeight: 500,
  },

  '& .label-form-visibility-description': {
    color: 'text.body',
    fontSize: theme.fontSize.body.sm.desktop,
  },

  '& .label-form-visibility-options': {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
    gap: `${theme.scale[400]}px`,
  },

  '& .label-form-visibility-option': {
    appearance: 'none',
    display: 'grid',
    gridTemplateColumns: '20px minmax(0, 1fr)',
    gap: `${theme.scale[200]}px`,
    padding: 0,
    border: 0,
    bgcolor: 'transparent',
    color: 'text.body',
    cursor: 'pointer',
    textAlign: 'left',
  },

  '& .label-form-visibility-option:disabled': {
    cursor: 'not-allowed',
    opacity: 0.55,
  },

  '& .label-form-radio': {
    width: '18px',
    height: '18px',
    marginTop: '2px',
    borderRadius: '50%',
    border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
    boxSizing: 'border-box',
  },

  '& .label-form-radio.selected': {
    border: `${theme.scale[150]}px solid ${theme.palette.surface.action}`,
  },

  '& .label-form-option-copy': {
    display: 'flex',
    flexDirection: 'column',
    gap: `${theme.scale[100]}px`,
  },

  '& .label-form-option-title': {
    color: 'text.body',
    fontSize: theme.fontSize.body.sm.desktop,
    fontWeight: 500,
  },

  '& .label-form-option-description': {
    color: 'text.body',
    fontSize: theme.fontSize.body.sm.desktop,
  },
})

/**
 * @param theme
 */
export const getManageStyles = (theme) => ({
  '& .label-dialog-body': {
    gap: `${theme.scale[300]}px`,
  },

  '& .label-manage-toolbar': {
    display: 'flex',
    alignItems: 'stretch',
    gap: `${theme.scale[300]}px`,
  },

  '& .label-manage-search': {
    flex: '1 0 0',
    minWidth: 0,
  },

  ...getSearchFieldStyles(theme, 'label-manage-search'),

  '& .label-manage-create': {
    alignSelf: 'center',
    height: `${theme.scale[800]}px`,
    minHeight: `${theme.scale[800]}px`,
    padding: `${theme.scale[300]}px ${theme.scale[400]}px`,
  },

  '& .table-scroll': {
    minHeight: 0,
    maxHeight: 'min(450px, calc(100vh - 290px))',
  },

  '& tbody tr.table-empty-row': {
    height: `${theme.scale[1600] + theme.scale[1100]}px`,
  },

  '& .label-manage-name': {
    display: 'flex',
    alignItems: 'center',
    gap: `${theme.scale[200]}px`,
  },

  '& .label-panel-dot': {
    ...getLabelDotStyles(theme),
  },

  '& .label-manage-actions': {
    display: 'flex',
    justifyContent: 'flex-end',
    opacity: 0,
    pointerEvents: 'none',
  },

  '& tbody tr:not(.filler-row):not(.table-empty-row):hover': {
    cursor: 'default',
    '& .label-manage-actions': {
      opacity: 1,
      pointerEvents: 'auto',
    },
  },

  '& tbody tr:focus-within .label-manage-actions': {
    opacity: 1,
    pointerEvents: 'auto',
  },
})
