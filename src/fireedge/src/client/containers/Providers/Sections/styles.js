import { makeStyles } from '@material-ui/core'

export default makeStyles(theme => ({
  permissions: {
    marginBottom: theme.spacing(2)
  },
  list: {
    '& p': {
      ...theme.typography.body2,
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    },
    '&.w-50 p': {
      width: '50%'
    },
    '&.w-25 p': {
      width: '50%'
    }
  },
  title: {
    '& p.bold': {
      fontWeight: theme.typography.fontWeightBold
    }
  }
}))
