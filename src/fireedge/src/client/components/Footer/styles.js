import { makeStyles } from '@material-ui/core'

export default makeStyles(theme => ({
  footer: {
    color: theme.palette.primary.contrastText,
    backgroundColor: theme.palette.primary.light,
    position: 'absolute',
    bottom: 0,
    left: 'auto',
    right: 0,
    width: '100%',
    zIndex: 1100,
    textAlign: 'center',
    padding: 5
  },
  heartIcon: {
    margin: '0 0.5em',
    color: theme.palette.error.dark
  },
  link: {
    color: theme.palette.primary.contrastText
  }
}))
