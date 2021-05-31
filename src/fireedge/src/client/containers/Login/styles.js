import { makeStyles } from '@material-ui/core'

export default makeStyles(theme => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    height: '100vh'
  },
  progress: {
    height: 4,
    width: '100%',
    [theme.breakpoints.only('xs')]: {
      top: 0,
      position: 'fixed'
    }
  },
  paper: {
    overflow: 'hidden',
    padding: theme.spacing(2),
    minHeight: 440,
    [theme.breakpoints.up('xs')]: {
      display: 'flex',
      flexDirection: 'column'
    },
    [theme.breakpoints.only('xs')]: {
      border: 'none',
      height: 'calc(100vh - 4px)',
      backgroundColor: 'transparent'
    }
  },
  wrapperForm: {
    padding: theme.spacing(),
    display: 'flex',
    overflow: 'hidden'
  },
  form: {
    width: '100%',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    [theme.breakpoints.up('xs')]: {
      justifyContent: 'center'
    }
  },
  loading: {
    opacity: 0.7
  },
  helper: {
    animation: '1s ease-out 0s 1'
  },
  submit: {
    margin: theme.spacing(3, 0, 2)
  }
}))
