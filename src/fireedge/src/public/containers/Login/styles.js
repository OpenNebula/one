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
      overflow: 'hidden',
      padding: theme.spacing(3),
      height: 400
    },
    logo: {
      display: 'block',
      width: '50%',
      margin: '0 auto',
      paddingBottom: theme.spacing(3)
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center'
    },
    helper: {
      animation: '1s ease-out 0s 1'
    }
  };
});
