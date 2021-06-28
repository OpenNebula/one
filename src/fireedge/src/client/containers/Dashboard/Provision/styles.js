import { makeStyles } from '@material-ui/core'

export default makeStyles({
  withoutAnimations: {
    '& *, & *::before, & *::after': {
      animation: 'none !important'
    }
  }
})
