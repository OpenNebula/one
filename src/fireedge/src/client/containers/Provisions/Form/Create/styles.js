import { makeStyles } from '@material-ui/core'

export default makeStyles(theme => ({
  root: {
    display: 'flex',
    flexFlow: 'column'
  },
  rootLog: {
    display: 'flex',
    flexFlow: 'column',
    height: '100%'
  },
  titleWrapper: {
    marginBottom: '1em',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.8em'
  },
  titleText: {
    ...theme.typography.body1
  }
}))
