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

export const CAPACITY_ACTION_SX = {
  padding: '0 0 0 8px',
  bgcolor: 'transparent',
  '&:hover': {
    color: 'icon.actionHover',
  },
}

/**
 * @param {object} theme - Current theme in use
 * @returns {object} - Capacity action group SX style
 */
export const CAPACITY_ACTION_GROUP_SX = (theme) => ({
  bgcolor: 'transparent',
  padding: '0px',
  gap: `${theme.scale[100]}px`,
  justifyContent: 'flex-end',
  flex: '0 0 auto',
})

/**
 * @param {object} root0 - Params
 * @param {object} root0.theme - Current theme in use
 * @returns {object} - Host info tab SX style
 */
export const getStyles = ({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',

  '& .top-container': {
    display: 'grid',
    gap: '16px',
    alignItems: 'stretch',
    gridTemplateColumns: {
      xs: '1fr',
      lg: 'repeat(2, minmax(0, 1fr))',
    },
  },

  '& .capacity-card': {
    overflow: 'auto',
    display: 'flex',
    flex: '1 1 0',
    minWidth: 0,
    minHeight: 0,
    padding: `${theme.scale[550]}px ${theme.scale[600]}px`,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: `${theme.scale[500]}px`,
    alignSelf: 'stretch',

    borderRadius: `${theme.borderRadius['3xl']}px`,
    border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
    bgcolor: 'surface.primary',
    height: '100%',

    '& .card-detail--label': {
      color: 'text.body',
      '&::after': {
        content: '":"',
      },
      alignSelf: 'center',
    },

    '& .capacity-detail--value': {
      color: 'text.headings',
      display: 'flex',
      alignItems: 'center',
      alignSelf: 'center',
      minWidth: 0,
      overflow: 'visible',
    },
  },

  '& .capacity-value': {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
    minWidth: 0,
  },

  '& .capacity-progress': {
    flex: '1 1 auto',
    minWidth: 0,
  },

  '& .capacity-progress [role="progressbar"]': {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '8px',
  },

  '& .capacity-progress .progress-track': {
    order: 1,
    flex: '1 1 auto',
    width: 'auto',
  },

  '& .capacity-progress .progress-label': {
    order: 2,
    flex: '0 0 auto',
    whiteSpace: 'nowrap',
  },

  '& .capacity-editor': {
    display: 'flex',
    alignItems: { xs: 'stretch', sm: 'center' },
    flexDirection: { xs: 'column', sm: 'row' },
    gap: '8px',
    width: '100%',
    minWidth: 0,
    overflow: 'visible',
  },

  '& .capacity-slider': {
    display: 'flex',
    flex: '1 1 auto',
    flexDirection: 'column',
    gap: '8px',
    minWidth: 0,
    overflow: 'visible',
    paddingTop: '8px',
    paddingBottom: '0px',
  },

  '& .capacity-slider-labels': {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '8px',
    color: 'text.body',
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

  '& .capacity-slider-labels span': {
    whiteSpace: 'nowrap',
  },

  '& .capacity-input': {
    flex: '0 0 136px',
    minWidth: '112px',
  },

  '& .capacity-input .textfield-container': {
    height: '40px',
  },
})
