import * as React from 'react'
import PropTypes from 'prop-types'

import { Box, CircularProgress, Typography } from '@material-ui/core'
import Count from 'client/components/Count'

const Circle = React.memo(() => {
  const [progress, setProgress] = React.useState(0)

  React.useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prevProgress => {
        const nextProgress = prevProgress + 2
        if (nextProgress === 100) clearInterval(timer)
        return nextProgress
      })
    }, 50)

    return () => clearInterval(timer)
  }, [])

  return (
    <CircularProgress
      color='secondary'
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
// CHART
// -------------------------------------

const SimpleCircle = React.memo(({ label, onClick }) => (
  <Box position='relative' display='inline-flex' width={1}>
    <Box display='flex' flexDirection='column' alignItems='center' width={1}>
      <Circle />
    </Box>
    <Box top={0} left={0} bottom={0} right={0}
      position='absolute'
      display='flex'
      alignItems='center'
      justifyContent='center'
    >
      <Typography variant='h4' component='div' onClick={onClick} style={{ cursor: 'pointer' }}>
        <Count number={label} />
      </Typography>
    </Box>
  </Box>
), (prev, next) => prev.label === next.label)

SimpleCircle.propTypes = {
  label: PropTypes.string,
  onClick: PropTypes.func
}

SimpleCircle.defaultProps = {
  label: undefined,
  onClick: () => undefined
}

SimpleCircle.displayName = 'SimpleCircle'

export default SimpleCircle
