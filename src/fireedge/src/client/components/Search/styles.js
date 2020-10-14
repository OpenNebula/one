import { makeStyles } from '@material-ui/core'

export default makeStyles(theme => ({
  backdrop: {
    [theme.breakpoints.only('xs')]: {
      backgroundColor: theme.palette.action.disabledOpacity
    }
  },
  paper: {
    padding: '1rem',
    [theme.breakpoints.only('xs')]: {
      width: '100%',
      height: '100%'
    }
  },
  header: { display: 'flex', alignItems: 'center' },
  title: { flexGrow: 1 },
  button: { justifyContent: 'start' }
}))
