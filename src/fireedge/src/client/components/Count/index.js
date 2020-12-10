import * as React from 'react'
import PropTypes from 'prop-types'

import { Typography } from '@material-ui/core'

const Count = ({ start, number, duration, ...props }) => {
  const [count, setCount] = React.useState('0')

  React.useEffect(() => {
    const end = parseInt(String(number).substring(0, 3))

    if (start === end) return

    const totalMilSecDur = parseInt(duration)
    const incrementTime = (totalMilSecDur / end) * 1000

    const timer = setInterval(() => {
      start += 1
      setCount(String(start) + number.substring(3))
      if (start === end) clearInterval(timer)
    }, incrementTime)

    return () => clearInterval(timer)
  }, [start, number, duration])

  return <Typography {...props}>{count}</Typography>
}

Count.propTypes = {
  start: PropTypes.number,
  number: PropTypes.string,
  duration: PropTypes.string,
  component: PropTypes.elementType
}

Count.defaultProps = {
  start: 0,
  number: '0',
  duration: '1',
  component: 'span'
}

Count.displayName = 'Count'

export default Count
