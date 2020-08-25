import { makeStyles } from '@material-ui/core';

export default makeStyles(theme => ({
  footer: {
    color: theme.palette.primary.light,
    position: 'fixed',
    bottom: 0,
    left: 'auto',
    right: 0,
    width: '100%',
    zIndex: 1100,
    backgroundColor: theme.palette.grey[800],
    textAlign: 'center',
    padding: 5
  },
  link: {
    color: theme.palette.primary.light
  }
}));
