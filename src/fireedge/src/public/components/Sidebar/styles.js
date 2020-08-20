import { makeStyles } from '@material-ui/core';

export default makeStyles(theme => ({
  menu: {
    width: '15rem',
    textTransform: 'capitalize',
    color: theme.palette.secondary.dark
  },
  logoWrapper: {
    padding: '1rem 2rem'
  },
  logo: {
    width: '100%'
  },
  nav: {
    paddingtop: 0,
    paddingBottom: 0
  },
  subitem: {
    paddingLeft: theme.spacing(4)
  }
}));
