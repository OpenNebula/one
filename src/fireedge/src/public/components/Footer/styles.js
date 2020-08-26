import { makeStyles } from '@material-ui/core';

export default makeStyles(theme => ({
  footer: {
    color: theme.palette.primary.light,
    position: 'absolute',
    bottom: 0,
    left: 'auto',
    right: 0,
    width: '100%',
    zIndex: 1100,
    backgroundColor: theme.palette.grey[800],
    textAlign: 'center',
    padding: 5
  },
  heartIcon: {
    margin: theme.spacing(0, 1),
    color: theme.palette.error.dark
  },
  link: {
    color: theme.palette.primary.light
  }
}));
