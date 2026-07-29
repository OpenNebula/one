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
 * @returns {object} Deployment styles
 */
export const getStyles = ({ theme }) => ({
  container: {
    marginTop: '15px',
    display: 'flex',
  },
  cardContainer: {
    display: 'grid',
    gridTemplateRows: 'repeat(3, 1fr)',
    gridTemplateColumns: '1fr',
    gap: '20px',
    alignItems: 'stretch',
  },
  cardGridItem: {
    display: 'flex',
  },
  card: {
    appearance: 'none',
    alignItems: 'flex-start',
    width: '100%',
    height: '100%',
    padding: `${theme.scale[400]}px ${theme.scale[500]}px`,
    gap: `${theme.scale[500]}px`,
    borderRadius: `${theme.borderRadius['2xl']}px`,
    border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
    bgcolor: 'surface.primary',
    color: 'text.body',
    cursor: 'pointer',
    textAlign: 'left',

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
  cardContent: {
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

    '& a': {
      color: 'text.action',
    },
  },
  linkContainer: {
    alignSelf: 'flex-end',
  },
  linkText: {
    marginTop: '5px',
    fontSize: '13px',
    fontStyle: 'normal',
    fontWeight: 400,
    lineHeight: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  },
  linkContent: {
    color: 'text.action',
    textDecoration: 'none',
  },
  linkIcon: {
    width: '10px',
    height: '10px',
  },
  groupInfo: {
    gridColumn: '1 / -1',
    marginTop: '1em',
    backgroundColor: 'surface.primary',
  },
})
