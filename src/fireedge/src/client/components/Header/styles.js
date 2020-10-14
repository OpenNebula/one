import { makeStyles } from '@material-ui/core'

export default makeStyles(theme => ({
  title: {
    flexGrow: 1,
    textTransform: 'capitalize'
  },
  /* POPOVER */
  backdrop: {
    [theme.breakpoints.only('xs')]: {
      backgroundColor: theme.palette.action.disabledOpacity
    }
  },
  paper: {
    [theme.breakpoints.only('xs')]: {
      width: '100%',
      height: '100%'
    }
  },
  padding: {
    padding: theme.spacing(2)
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderBottom: '1px solid',
    borderBottomColor: theme.palette.action.disabledBackground
  },
  buttonLabel: {
    paddingLeft: theme.spacing(1),
    [theme.breakpoints.only('xs')]: {
      display: 'none'
    }
  },
  /* GROUP SWITCHER */
  headerSwitcherLabel: { flexGrow: 1 },
  groupButton: { justifyContent: 'start' },
  groupSelectedIcon: {
    fontSize: '1rem',
    margin: theme.spacing(0, 2)
  }
}))
