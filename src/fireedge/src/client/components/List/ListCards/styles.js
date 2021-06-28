import { makeStyles } from '@material-ui/core'

export default makeStyles({
  cardPlus: {
    height: '100%',
    minHeight: 140,
    display: 'flex',
    textAlign: 'center'
  },
  loading: {
    width: '100%',
    marginBottom: '1em'
  },
  item: {
    '&-enter': { opacity: 0 },
    '&-enter-active': {
      opacity: 1,
      transition: 'opacity 400ms ease-in'
    },
    '&-exit': { opacity: 1 },
    '&-exit-active': {
      opacity: 0,
      transition: 'opacity 400ms ease-in'
    }
  }
})
