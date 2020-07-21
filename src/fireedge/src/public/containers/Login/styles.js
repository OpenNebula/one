import { makeStyles } from '@material-ui/core';

export default makeStyles(theme => {
  // const getColor = theme.palette.type === 'light' ? darken : lighten;
  // const getBackgroundColor = theme.palette.type === 'light' ? lighten : darken;
  // color: getColor(theme.palette.error.main, 0.6),
  // backgroundColor: getBackgroundColor(theme.palette.error.main, 0.9)

  return {
    root: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center'
    },
    paper: {
      padding: theme.spacing(3)
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center'
    },
    logo: {
      width: '50%',
      margin: '1.5rem auto'
    },
    helper: {
      animation: '1s ease-out 0s 1'
    }
  };
});
