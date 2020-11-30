import { makeStyles, fade } from '@material-ui/core'

export default makeStyles(theme => ({
  root: {
    padding: theme.spacing(2, 3)
  },
  title: {
    padding: theme.spacing(2),
    borderBottom: '1px solid #e5e5e5'
  },
  titleText: {
    letterSpacing: 0.1,
    fontWeight: 500
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    borderBottom: '1px solid #e5e5e5'
  },
  buttons: {
    flexGrow: 1,
    [theme.breakpoints.only('xs')]: {
      borderBottom: '1px solid #e5e5e5'
    }
  },
  search: {
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: fade(theme.palette.primary.main, 0.15),
    '&:hover': {
      backgroundColor: fade(theme.palette.primary.main, 0.25)
    },
    margin: theme.spacing(1, 0),
    width: '100%',
    [theme.breakpoints.up('sm')]: {
      marginLeft: theme.spacing(1),
      width: 'auto'
    }
  },
  searchIcon: {
    padding: theme.spacing(0, 2),
    height: '100%',
    position: 'absolute',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  inputRoot: { color: 'inherit' },
  inputInput: {
    padding: theme.spacing(1, 1, 1, 0),
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${theme.spacing(4)}px)`,
    width: '100%'
  }
}))
