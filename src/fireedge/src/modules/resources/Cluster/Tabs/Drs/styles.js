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
 * @returns {object} - Cluster DRS tab styles
 */
export const getStyles = ({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: {
    xs: '1fr',
    lg: '1fr 3fr',
  },
  alignItems: 'stretch',
  gap: `${theme.scale[300]}px`,
  height: '100%',
  minHeight: 0,
  minWidth: 0,

  '& .drs-configuration': {
    display: 'flex',
    flexDirection: 'column',
    gap: `${theme.scale[400]}px`,
    paddingRight: {
      xs: 0,
      lg: `${theme.scale[300]}px`,
    },
    borderRight: {
      xs: 'none',
      lg: `${theme.borderWidth.sm}px solid ${theme.palette.divider}`,
    },
    minWidth: 0,
    minHeight: 'max-content',
    overflow: 'visible',

    '& > :last-child': {
      flex: '0 0 auto',
      minHeight: 'max-content',
    },
  },

  '& .drs-actions': {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: `${theme.scale[300]}px`,
    flexWrap: 'wrap',
  },

  '& .drs-recommendations': {
    display: 'flex',
    flexDirection: 'column',
    gap: `${theme.scale[400]}px`,
    minWidth: 0,
    minHeight: 0,
  },

  '& .drs-recommendations-header': {
    display: 'flex',
    flexDirection: {
      xs: 'column',
      sm: 'row',
    },
    alignItems: {
      xs: 'stretch',
      sm: 'center',
    },
    justifyContent: 'space-between',
    gap: `${theme.scale[300]}px`,
    minWidth: 0,
  },

  '& .drs-title': {
    color: 'text.headings',
    fontSize: {
      xs: theme.fontSize.body.lg.mobile,
      sm: theme.fontSize.body.lg.tablet,
      md: theme.fontSize.body.lg.desktop,
    },
    fontWeight: 600,
    lineHeight: {
      xs: theme.lineHeight.body.lg.mobile,
      sm: theme.lineHeight.body.lg.tablet,
      md: theme.lineHeight.body.lg.desktop,
    },
    margin: 0,
  },

  '& .drs-recommendation-actions': {
    display: 'flex',
    alignItems: 'center',
    justifyContent: {
      xs: 'flex-start',
      sm: 'flex-end',
    },
    gap: `${theme.scale[300]}px`,
    flexWrap: 'wrap',
  },

  '& .drs-weights-list': {
    display: 'flex',
    flexDirection: 'column',
    gap: `${theme.scale[100]}px`,
    minWidth: 0,
  },

  '& .drs-weight-row': {
    display: 'flex',
    justifyContent: 'space-between',
    gap: `${theme.scale[200]}px`,
    minWidth: 0,
  },

  '& .drs-weight-label': {
    color: 'text.body',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  '& .drs-weight-value': {
    color: 'text.headings',
    flex: '0 0 auto',
  },

  '& .drs-state-cell': {
    display: 'flex',
    alignItems: 'center',
    gap: `${theme.scale[200]}px`,
    minWidth: 0,
  },

  '& .drs-alert-info-icon': {
    color: 'inherit',
    width: '16px',
    height: '16px',
  },

  '& .drs-recommendations-table': {
    minWidth: 0,
    minHeight: 0,
  },
})
