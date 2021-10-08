/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
import makeStyles from '@mui/styles/makeStyles'
import { sidebar, toolbar } from 'client/theme/defaults'

export default makeStyles(theme => ({
  // -------------------------------
  // CONTAINER MENU
  // -------------------------------
  drawerPaper: {
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[1],
    border: 'none',
    width: 0,
    visibility: 'hidden',
    whiteSpace: 'nowrap',
    overflowX: 'hidden',
    flexShrink: 0,
    transition: theme.transitions.create(['width', 'visibility', 'display'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen
    }),
    [theme.breakpoints.up('lg')]: {
      width: sidebar.minified,
      visibility: 'visible',
      // CONTAINER ONLY WHEN EXPANDED
      '&:hover': {
        width: sidebar.fixed,
        transition: theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen
        }),
        '& #logo__text': {
          visibility: 'visible'
        }
      },
      // CONTAINER ONLY WHEN MINIFIED
      '&:not(:hover)': {
        '& #logo__text': {
          visibility: 'hidden'
        },
        '& $subItemWrapper': {
          display: 'none'
        },
        '& $itemText::before': {
          content: 'attr(data-min-label)'
        }
      }
    }
  },
  drawerFixed: {
    width: sidebar.fixed,
    visibility: 'visible',
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen
    }),
    [theme.breakpoints.only('xs')]: {
      width: '100%'
    },
    [theme.breakpoints.up('lg')]: {
      width: sidebar.fixed,
      '& #logo__text': {
        visibility: 'visible !important'
      },
      '& $subItemWrapper': {
        display: 'block !important'
      },
      '& $itemText::before': {
        content: 'attr(data-max-label) !important'
      }
    }
  },
  // -------------------------------
  // HEADER MENU
  // -------------------------------
  header: {
    userSelect: 'none',
    backgroundColor: theme.palette.background.paper,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem',
    overflow: 'hidden',
    height: toolbar.regular,
    minHeight: toolbar.regular,
    [`${theme.breakpoints.up('xs')} and (orientation: landscape)`]: {
      minHeight: toolbar.xs
    },
    [theme.breakpoints.up('sm')]: {
      minHeight: toolbar.sm
    }
  },
  svg: {
    minWidth: 100
  },
  // -------------------------------
  // LIST MENU
  // -------------------------------
  menu: {
    overflowY: 'auto',
    overflowX: 'hidden',
    textTransform: 'capitalize',
    color: 'transparent',
    transition: 'color 0.3s',
    '&:hover': {
      color: theme.palette.primary.light
    },
    '&::-webkit-scrollbar': {
      width: 14
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundClip: 'content-box',
      border: '4px solid transparent',
      borderRadius: 7,
      boxShadow: 'inset 0 0 0 10px',
      color: theme.palette.secondary.light
    }
  },
  list: {
    color: theme.palette.text.primary
  },
  itemText: {
    '&::before': {
      ...theme.typography.body1,
      display: 'block',
      minWidth: 100,
      content: 'attr(data-max-label)'
    }
  },
  subItemWrapper: {},
  subItem: {
    paddingLeft: theme.spacing(4)
  }
}))
