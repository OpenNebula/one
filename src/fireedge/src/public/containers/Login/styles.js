import { makeStyles } from '@material-ui/core';

export default makeStyles(theme => ({
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
  }
}));
