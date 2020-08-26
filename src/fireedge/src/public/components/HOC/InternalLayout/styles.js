import { makeStyles } from '@material-ui/core';
import { sidebarWidth } from 'client/assets/theme';

export default makeStyles(theme => ({
  root: {
    flex: '1 1 auto',
    display: 'flex',
    zIndex: '3',
    overflow: 'hidden',
    position: 'relative',
    flexDirection: 'column',
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen
    }),
    [theme.breakpoints.up('lg')]: {
      marginLeft: sidebarWidth.minified
    }
  },
  isDrawerFixed: {
    [theme.breakpoints.up('lg')]: {
      marginLeft: sidebarWidth.fixed
    }
  },
  main: {
    paddingTop: 64,
    paddingBottom: 30,
    height: '100vh',
    width: '100%'
  },
  scrollable: {
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(2),
    height: '100%',
    overflow: 'auto',
    '&::-webkit-scrollbar': {
      width: 14
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundClip: 'content-box',
      border: '4px solid transparent',
      borderRadius: 7,
      boxShadow: 'inset 0 0 0 10px',
      color: theme.palette.primary.light
    }
  }
}));
