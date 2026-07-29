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
 * @returns {object} - Service tab SX style
 */
export const getTabStyles = ({ theme }) => ({
  display: 'flex',
  flex: '1 1 0',
  flexDirection: 'column',
  minHeight: 0,
  gap: `${theme.scale[700]}px`,
  overflowY: 'auto',

  '& .service-tab-toolbar': {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: `${theme.scale[600]}px`,
    flexWrap: 'wrap',
  },

  '& .service-tab-selection-count': {
    color: 'text.body',
    whiteSpace: 'nowrap',
  },

  '& .service-tab-empty-state': {
    color: 'text.body',
    padding: `${theme.scale[500]}px`,
    textAlign: 'center',
  },

  '& .service-tab-table': {
    display: 'flex',
    flex: '0 0 auto',
    flexDirection: 'column',
    minHeight: 0,
  },

  '& .service-tab-grid': {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: `${theme.scale[700]}px`,
    alignItems: 'stretch',
  },

  '& .service-tab-grid > *': {
    minWidth: 0,
  },

  '& .service-tab-stack': {
    display: 'flex',
    flexDirection: 'column',
    gap: `${theme.scale[700]}px`,
  },

  '& .service-tab-attributes': {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '240px',
  },

  '& .service-logs-viewer': {
    display: 'flex',
    flex: '1 1 0',
    minHeight: 0,
    minWidth: 0,
    width: '100%',

    '& > *': {
      flex: '1 1 0',
      minHeight: 0,
      minWidth: 0,
    },
  },

  '& .service-roles-workspace': {
    display: 'grid',
    gridTemplateColumns: {
      xs: '1fr',
      lg: 'minmax(0, 1.35fr) minmax(360px, 0.65fr)',
    },
    gap: `${theme.scale[700]}px`,
    alignItems: 'start',
  },

  '& .service-role-main': {
    display: 'flex',
    flexDirection: 'column',
    gap: `${theme.scale[700]}px`,
    minWidth: 0,
  },

  '& .service-role-name-cell': {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: `${theme.scale[300]}px`,
    minWidth: 0,
  },

  '& .service-role-name': {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
  },

  '& .service-role-active-marker': {
    flex: '0 0 auto',
    color: 'text.information',
    fontSize: theme.fontSize.body.caption.desktop,
    lineHeight: theme.lineHeight.body.caption.desktop,
    fontWeight: 600,
  },

  '& .service-role-inspector': {
    display: 'flex',
    flexDirection: 'column',
    gap: `${theme.scale[600]}px`,
    minWidth: 0,
    minHeight: '320px',
  },

  '& .service-role-inspector-header': {
    display: 'flex',
    flexDirection: 'column',
    gap: `${theme.scale[300]}px`,
    minWidth: 0,
  },

  '& .service-role-inspector-title-row': {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: `${theme.scale[500]}px`,
    minWidth: 0,
  },

  '& .service-role-inspector-title': {
    color: 'text.headings',
    fontWeight: 600,
    fontSize: theme.fontSize.heading.h6.desktop,
    lineHeight: theme.lineHeight.heading.h6.desktop,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  '& .service-role-inspector-meta': {
    display: 'flex',
    flexDirection: 'row',
    gap: `${theme.scale[500]}px`,
    flexWrap: 'wrap',
    color: 'text.body',
  },

  '& .service-role-inspector-body': {
    display: 'flex',
    flexDirection: 'column',
    gap: `${theme.scale[600]}px`,
    minWidth: 0,
  },

  '& .service-role-template': {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '240px',
  },

  '& .service-role-empty-inspector': {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: `${theme.scale[500]}px`,
    minHeight: '240px',
    padding: `${theme.scale[600]}px`,
    borderRadius: `${theme.borderRadius['3xl']}px`,
    border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
    bgcolor: 'surface.primary',
  },

  '& .service-role-empty-title': {
    color: 'text.headings',
    fontWeight: 600,
    fontSize: theme.fontSize.heading.h6.desktop,
    lineHeight: theme.lineHeight.heading.h6.desktop,
  },

  '& .service-role-empty-description': {
    color: 'text.body',
  },
})
