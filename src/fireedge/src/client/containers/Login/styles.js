import { makeStyles } from '@material-ui/core';

export default makeStyles(theme =>
  // const getColor = theme.palette.type === 'light' ? darken : lighten;
  // const getBackgroundColor = theme.palette.type === 'light' ? lighten : darken;
  // color: getColor(theme.palette.error.main, 0.6),
  // backgroundColor: getBackgroundColor(theme.palette.error.main, 0.9)

  ({
    root: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      height: '100vh'
    },
    loading: {
      height: 4,
      width: '100%',
      [theme.breakpoints.only('xs')]: {
        top: 0,
        position: 'fixed'
      }
    },
    paper: {
      overflow: 'hidden',
      padding: theme.spacing(3),
      minHeight: 400,
      [theme.breakpoints.only('xs')]: {
        border: 'none',
        height: 'calc(100vh - 4px)',
        backgroundColor: 'transparent'
      }
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center'
    },
    helper: {
      animation: '1s ease-out 0s 1'
    }
  })
);
