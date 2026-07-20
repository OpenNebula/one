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

const getDialogWidth = (theme) =>
  theme.scale[1800] + theme.scale[1700] + theme.scale[1300] + theme.scale[600]

/**
 * @param {object} root0 - Params
 * @param {object} root0.theme - Current theme in use
 * @returns {object} Create type dialog styles
 */
export const getStyles = ({ theme }) => ({
  root: {
    '& .MuiBackdrop-root': {
      bgcolor:
        theme.palette.mode === 'dark'
          ? 'rgba(0, 0, 0, 0.56)'
          : 'rgba(17, 24, 39, 0.42)',
      backdropFilter: 'blur(6px)',
      WebkitBackdropFilter: 'blur(6px)',
    },

    '& .MuiDialog-paper': {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'stretch',
      gap: `${theme.scale[500]}px`,
      width: `min(${getDialogWidth(theme)}px, calc(100vw - ${
        theme.scale[700]
      }px))`,
      maxWidth: 'none',
      margin: 0,
      padding: `${theme.scale[600]}px`,
      borderRadius: `${theme.borderRadius.xlg}px`,
      border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
      bgcolor: 'surface.page',
      boxShadow:
        '0 4px 6px -4px rgba(0, 0, 0, 0.10), 0 10px 15px -13px rgba(0, 0, 0, 0.10)',
    },
  },

  header: {
    gap: `${theme.scale[200]}px`,
  },

  title: {
    color: 'text.headings',
    fontSize: {
      xs: theme.fontSize.heading.h6.mobile,
      sm: theme.fontSize.heading.h6.tablet,
      md: theme.fontSize.heading.h6.desktop,
    },
    fontWeight: {
      xs: theme.fontWeight.heading.h6.mobile,
      sm: theme.fontWeight.heading.h6.tablet,
      md: theme.fontWeight.heading.h6.desktop,
    },
    lineHeight: {
      xs: theme.lineHeight.heading.h5.mobile,
      sm: theme.lineHeight.heading.h5.tablet,
      md: theme.lineHeight.heading.h5.desktop,
    },
  },

  subtitle: {
    color: 'text.body',
    fontSize: {
      xs: theme.fontSize.body.sm.mobile,
      sm: theme.fontSize.body.sm.tablet,
      md: theme.fontSize.body.sm.desktop,
    },
    fontWeight: {
      xs: 500,
      sm: 500,
      md: 500,
    },
    lineHeight: {
      xs: theme.lineHeight.body.sm.mobile,
      sm: theme.lineHeight.body.sm.tablet,
      md: theme.lineHeight.body.sm.desktop,
    },
  },

  cards: {
    display: 'flex',
    gap: `${theme.scale[500]}px`,
  },

  card: {
    appearance: 'none',
    alignItems: 'flex-start',
    width: '100%',
    padding: `${theme.scale[400]}px ${theme.scale[500]}px`,
    gap: `${theme.scale[500]}px`,
    borderRadius: `${theme.borderRadius['2xl']}px`,
    border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
    bgcolor: 'surface.primary',
    color: 'text.body',
    cursor: 'pointer',
    textAlign: 'left',
    maxWidth: `${getDialogWidth(theme) / 2}px`,

    '&:hover': {
      borderColor: theme.palette.border.actionHover,
      bgcolor: 'surface.actionHover2',
    },

    '&:focus-visible': {
      outline: `${theme.borderWidth.md}px solid ${theme.palette.border.focus}`,
      outlineOffset: `${theme.scale[50]}px`,
    },
  },

  cardSelected: {
    borderColor: theme.palette.border.action,
    bgcolor: 'surface.actionHover2',
  },

  iconBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: `${theme.borderRadius['2xl']}px`,
    border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
    color: 'text.action',
    padding: `${theme.scale[150]}px`,

    '& svg': {
      width: `${theme.scale[600]}px`,
      height: `${theme.scale[600]}px`,
    },
  },

  cardContent: {
    gap: `${theme.scale[200]}px`,
  },

  cardTitle: {
    color: 'text.headings',
    fontSize: {
      xs: `${theme.scale[500]}px`,
      sm: `${theme.scale[500]}px`,
      md: `${theme.scale[500]}px`,
    },
    fontWeight: {
      xs: theme.fontWeight.heading.h6.mobile,
      sm: theme.fontWeight.heading.h6.tablet,
      md: theme.fontWeight.heading.h6.desktop,
    },
    lineHeight: {
      xs: `${theme.scale[600]}px`,
      sm: `${theme.scale[600]}px`,
      md: `${theme.scale[600]}px`,
    },
  },

  cardSubtitle: {
    color: 'text.body',
    fontSize: {
      xs: theme.fontSize.body.caption.mobile,
      sm: theme.fontSize.body.caption.tablet,
      md: theme.fontSize.body.caption.desktop,
    },
    fontWeight: {
      xs: theme.fontWeight.body.caption.mobile,
      sm: theme.fontWeight.body.caption.tablet,
      md: theme.fontWeight.body.caption.desktop,
    },
    lineHeight: {
      xs: theme.lineHeight.body.caption.mobile,
      sm: theme.lineHeight.body.caption.tablet,
      md: theme.lineHeight.body.caption.desktop,
    },
  },

  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: `${theme.scale[200]}px`,
  },
})
