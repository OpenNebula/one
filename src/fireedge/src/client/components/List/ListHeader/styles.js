import { makeStyles, fade } from '@material-ui/core'

export default makeStyles(theme => ({
  root: {
    top: 0,
    position: 'sticky',
    zIndex: theme.zIndex.appBar,
    borderRadius: theme.spacing(0.5),
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[10],
    padding: theme.spacing(2, 3),
    display: 'flex',
    flexWrap: 'wrap',
    [theme.breakpoints.up('sm')]: {
      borderBottom: `1px solid ${theme.palette.divider}`
    }
  },
  title: {
    flexGrow: 1,
    display: 'flex',
    alignItems: 'center',
    [theme.breakpoints.only('xs')]: {
      borderBottom: `1px solid ${theme.palette.divider}`
    }
  },
  titleText: {
    flexGrow: 1,
    letterSpacing: 0.1,
    fontWeight: 500
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    [theme.breakpoints.only('xs')]: {
      width: '100%',
      borderBottom: `1px solid ${theme.palette.divider}`
    }
  },
  search: {
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: fade(theme.palette.primary.dark, 0.15),
    '&:hover': {
      backgroundColor: fade(theme.palette.primary.dark, 0.25)
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
