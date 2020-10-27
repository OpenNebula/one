import { makeStyles } from '@material-ui/core'

export default makeStyles(theme =>
// const getColor = theme.palette.type === 'light' ? darken : lighten;
// const getBackgroundColor = theme.palette.type === 'light' ? lighten : darken;
// color: getColor(theme.palette.error.main, 0.6),
// backgroundColor: getBackgroundColor(theme.palette.error.main, 0.9)

  ({
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
      height: 440,
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
      flexGrow: 1,
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
  })
)
