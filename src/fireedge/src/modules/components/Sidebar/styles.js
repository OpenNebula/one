/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import { sidebar, toolbar } from '@ProvidersModule'

export default (theme) => ({
  // -------------------------------
  // CONTAINER MENU
  // -------------------------------
  drawerPaper: css({
    backgroundColor: theme.palette.background.paper,
    // padding: '0.25rem',
    boxShadow: theme.shadows[1],
    border: 'none',
    width: 0,
    visibility: 'hidden',
    whiteSpace: 'nowrap',
    overflowX: 'hidden',
    flexShrink: 0,
    transition: theme.transitions.create(['width', 'visibility', 'display'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    [theme.breakpoints.up('lg')]: {
      width: sidebar.minified,
      visibility: 'visible',
      // CONTAINER ONLY WHEN EXPANDED
      '&:hover': {
        width: sidebar.fixed,
        transition: theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
        '& #logo__text': {
          visibility: 'visible',
        },
      },
      // CONTAINER ONLY WHEN MINIFIED
      '&:not(:hover)': {
        '& #logo__text': {
          visibility: 'hidden',
        },
        '& .subItemWrapper': {
          display: 'none',
        },
        '& .itemText': {
          display: 'none',
        },
        '& .itemCollapseLogo': {
          display: 'none',
        },
        '& .itemExpandLogo': {
          display: 'none',
        },
      },
    },
  }),
  drawerFixed: css({
    width: sidebar.fixed,
    visibility: 'visible',
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    [theme.breakpoints.only('xs')]: {
      width: '100%',
    },
    [theme.breakpoints.up('lg')]: {
      width: sidebar.fixed,
      '& #logo__text': {
        visibility: 'visible !important',
      },
      '& .subItemWrapper': {
        display: 'block !important',
      },
      '& .itemText': {
        display: 'block !important',
      },
    },
  }),
  // -------------------------------
  // HEADER MENU
  // -------------------------------
  header: css({
    userSelect: 'none',
    backgroundColor: theme.palette.background.paper,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1.875rem 1rem 1rem 1rem',
    overflow: 'hidden',
    height: toolbar.regular,
    minHeight: toolbar.regular,
    [`${theme.breakpoints.up('xs')} and (orientation: landscape)`]: {
      minHeight: toolbar.xs,
    },
    [theme.breakpoints.up('sm')]: {
      minHeight: toolbar.sm,
    },
  }),
  logo: css({
    minWidth: '9.6875rem',
    marginTop: '',
  }),
  logoAux: css({
    height: '1.125rem',
    width: '1.125rem',
  }),
  // -------------------------------
  // LIST MENU
  // -------------------------------
  menu: css({
    overflowY: 'auto',
    overflowX: 'hidden',
    textTransform: 'capitalize',
    transition: 'color 0.3s',
    padding: '0.5rem 0.5rem 0.5rem 0rem',
    marginTop: '0.75rem',
  }),
  item: css({
    marginTop: '0.125rem',
    '&.MuiListItemText-root': {
      margin: 0,
    },
    '&.MuiListItemButton-root.Mui-selected': {
      borderRadius: '0 6.25rem 6.25rem 0',
    },
    '&.MuiListItemButton-root.Mui-selected:hover': {
      backgroundColor: theme.palette.sidebar.backgroundColorHover,
      borderRadius: '0 6.25rem 6.25rem 0',
    },
    '&.MuiListItemButton-root:hover': {
      backgroundColor: theme.palette.sidebar.backgroundColorHover,
      borderRadius: '0 6.25rem 6.25rem 0',
    },
  }),
  itemPepe: css({
    margin: 0,
  }),

  itemLink: css({
    padding: '1rem 1rem 1rem 2rem',
    fontSize: '1 rem',
    marginLeft: '0.1rem',
    marginRight: '0.1rem',
    minWidth: 0,
    '&.MuiListItemButton-root.Mui-selected': {
      backgroundColor: theme.palette.sidebar.backgroundColorSelectedLink,
      borderRadius: '0 6.25rem 6.25rem 0',
    },
  }),
  itemCollapse: css({
    padding: '1rem 1rem 1rem 2rem',
    fontSize: '1 rem',
    marginLeft: '0.1rem',
    marginRight: '0.1rem',
    minWidth: 0,
    '&.MuiListItemButton-root.Mui-selected': {
      backgroundColor: theme.palette.sidebar.backgroundColorSelectedCollapse,
      borderRadius: '0 6.25rem 6.25rem 0',
    },
  }),
  itemIcon: css({
    minWidth: 0,
    marginRight: '0.75rem',
  }),
  subItem: css({
    paddingLeft: '2.5rem',
  }),
})
