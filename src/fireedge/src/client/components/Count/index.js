import * as React from 'react'
import PropTypes from 'prop-types'

const Count = ({ start, number, duration }) => {
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

  return count
}

Count.propTypes = {
  start: PropTypes.number,
  number: PropTypes.string,
  duration: PropTypes.string
}

Count.defaultProps = {
  start: 0,
  number: '0',
  duration: '1'
}

Count.displayName = 'Count'

export default Count
