import { makeStyles } from '@material-ui/core'

export default makeStyles(theme => ({
  marginBottom: {
    marginBottom: theme.spacing(2)
  },
  list: {
    '& p': {
      ...theme.typography.body2,
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    },
    '&.w-50 > *': {
      '& > p, & > span': {
        width: '50%'
      }
    },
    '&.w-25 > *': {
      '& > p, & > span': {
        width: '25%'
      }
    }
  },
  title: {
    '& p.bold': {
      fontWeight: theme.typography.fontWeightBold
    }
  },
  alignToRight: {
    textAlign: 'right'
  }
}))
