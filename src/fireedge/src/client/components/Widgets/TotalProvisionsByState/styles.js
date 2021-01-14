import { makeStyles } from '@material-ui/core'

export default makeStyles(theme => ({
  root: {
    height: '100%',
    padding: '2em',
    display: 'grid',
    gridAutoRows: 'auto 1fr',
    alignItems: 'center'
  },
  title: {
    padding: '0 2em 2em',
    textAlign: 'left'
  },
  titlePrimary: {
    fontSize: '2rem',
    color: theme.palette.text.primary,
    '& span': {
      marginLeft: '1rem'
    }
  },
  titleSecondary: {
    fontSize: '1.4rem',
    color: theme.palette.text.secondary
  },
  content: {
    padding: '0 2em'
  }
}))
