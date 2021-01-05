import { makeStyles } from '@material-ui/core'

export default makeStyles(() => ({
  root: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gridGap: '2em'
  }
}))
