import * as React from 'react'
import PropTypes from 'prop-types'

import { makeStyles, Box, CircularProgress } from '@material-ui/core'
import Count from 'client/components/Count'

const useStyles = makeStyles(() => ({
  circle: { stroke: ({ color }) => `${color} !important` }
}))

const Circle = React.memo(({ color }) => {
  const classes = useStyles({ color })
  const [progress, setProgress] = React.useState(0)

  React.useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prevProgress => {
        const nextProgress = prevProgress + 5
        if (nextProgress === 100) clearInterval(timer)
        return nextProgress
      })
    }, 50)

    return () => clearInterval(timer)
  }, [])

  return (
    <CircularProgress
      classes={{ circle: classes.circle }}
      size={150}
      thickness={5}
      value={progress}
      variant='determinate'
    />
  )
}, (prev, next) => prev.color === next.color)

Circle.propTypes = { color: PropTypes.string }
Circle.defaultProps = { color: 'primary' }
Circle.displayName = 'Circle'

// -------------------------------------
// WIDGET
// -------------------------------------

const SimpleCircle = React.memo(({ label, color }) => (
  <Box position='relative' display='inline-flex' width={1}>
    <Box display='flex' flexDirection='column' alignItems='center' width={1}>
      <Circle color={color} />
    </Box>
    <Box top={0} left={0} bottom={0} right={0}
      position='absolute'
      display='flex'
      alignItems='center'
      justifyContent='center'
    >
      <Count number={label} variant='h4' component='div' color='textSecondary' />
    </Box>
  </Box>
), (prev, next) => prev.label === next.label)

SimpleCircle.propTypes = {
  label: PropTypes.string,
  color: PropTypes.string
}

SimpleCircle.defaultProps = {
  label: undefined,
  color: 'primary'
}

SimpleCircle.displayName = 'SimpleCircle'

export default SimpleCircle
