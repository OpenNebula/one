import { makeStyles } from '@material-ui/core';
import { sidebarWidth } from 'client/assets/theme';

export default makeStyles(theme => ({
  // -------------------------------
  // CONTAINER MENU
  // -------------------------------
  drawerPaper: {
    width: 0,
    whiteSpace: 'nowrap',
    overflowX: 'hidden',
    flexShrink: 0,
    transition: theme.transitions.create(['width', 'visibility', 'display'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen
    }),
    [theme.breakpoints.up('lg')]: {
      width: sidebarWidth.minified,
      // CONTAINER ONLY WHEN EXPANDED
      '&:hover': {
        width: sidebarWidth.fixed,
        transition: theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen
        }),
        '& #logo__text__top, & #logo__text__bottom': {
          visibility: 'visible'
        }
      },
      // CONTAINER ONLY WHEN MINIFIED
      '&:not(:hover)': {
        '& #logo__text__top, & #logo__text__bottom': {
          visibility: 'hidden'
        },
        '& $menu': {
          overflowY: 'hidden'
        },
        '& $expandIcon, & $subItemWrapper': {
          display: 'none'
        }
      }
    }
  },
  drawerFixed: {
    width: '100%',
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen
    }),
    [theme.breakpoints.only('md')]: {
      width: sidebarWidth.fixed
    },
    [theme.breakpoints.up('lg')]: {
      width: sidebarWidth.fixed,
      '& #logo__text__top, & #logo__text__bottom': {
        visibility: 'visible !important'
      },
      '& $expandIcon, & $subItemWrapper': {
        display: 'block !important'
      }
    }
  },
  // -------------------------------
  // HEADER MENU
  // -------------------------------
  header: {
    display: 'flex',
    alignItems: 'center',
    padding: '1rem',
    overflow: 'hidden',
    height: 64, // appbar height
    minHeight: 64 // appbar height
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
      boxShadow: 'inset 0 0 0 10px'
    },
    '&::-webkit-scrollbar-button': {
      width: 0,
      height: 0,
      display: 'none'
    },
    '&::-webkit-scrollbar-corner': {
      backgroundColor: 'transparent'
    }
  },
  list: {
    color: theme.palette.common.black
  },
  expandIcon: {},
  subItemWrapper: {},
  subItem: {
    paddingLeft: theme.spacing(4)
  },
  itemSelected: {
    backgroundColor: theme.palette.primary.light,
    '&:hover': {
      backgroundColor: theme.palette.primary.light
    }
  }
}));
