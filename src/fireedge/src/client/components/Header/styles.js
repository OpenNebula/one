import { makeStyles } from '@material-ui/core'

export default makeStyles(theme => ({
  appbar: {
    position: 'absolute',
    transition: theme.transitions.create('background-color'),
    backgroundColor: ({ isScroll }) => isScroll
      ? theme.palette.secondary.main
      : theme.palette.primary.main
  },
  title: {
    userSelect: 'none',
    flexGrow: 1,
    display: 'inline-flex',
    color: theme.palette.primary.contrastText,
    '& span': { textTransform: 'capitalize' }
  },
  app: {
    color: ({ isScroll }) => isScroll
      ? theme.palette.primary.main
      : theme.palette.secondary.main
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
  padding: { padding: theme.spacing(2) },
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
}
))
