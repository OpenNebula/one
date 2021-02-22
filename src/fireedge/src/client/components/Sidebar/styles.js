import { makeStyles } from '@material-ui/core'
import { sidebar, toolbar } from 'client/theme/defaults'

export default makeStyles(theme => ({
  // -------------------------------
  // CONTAINER MENU
  // -------------------------------
  drawerPaper: {
    backgroundColor: theme.palette.background.paper,
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
    userSelect: 'none',
    backgroundColor: theme.palette.type === 'dark'
      ? theme.palette.background.paper
      : theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    display: 'flex',
    alignItems: 'center',
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
    color: theme.palette.text.primary
  },
  expandIcon: {},
  subItemWrapper: {},
  subItem: {
    paddingLeft: theme.spacing(4)
  },
  itemSelected: {
    color: theme.palette.text.primary,
    backgroundColor: theme.palette.primary.light,
    '&:hover': { backgroundColor: theme.palette.primary.light }
  },
  hamburger: {
    color: theme.palette.primary.contrastText
  }
}))
