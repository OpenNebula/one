import { makeStyles } from '@material-ui/core'

export default makeStyles(theme => ({
  root: {
    padding: '2em'
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
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(125px, 1fr))',
    gridGap: '2em',
    padding: '0 2em'
  },
  legendSecondary: {
    fontSize: '0.9rem',
    marginLeft: '1.2rem',
    color: theme.palette.text.secondary
  },
  chart: {
    height: 200,
    [theme.breakpoints.only('xs')]: {
      display: 'none'
    }
  }
}))
