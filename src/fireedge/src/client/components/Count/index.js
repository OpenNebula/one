/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
 *                                                                           *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may   *
 * not use this file except in compliance with the License. You may obtain   *
 * a copy of the License at                                                  *
 *                                                                           *
 * http://www.apache.org/licenses/LICENSE-2.0                                *
 *                                                                           *
 * Unless required by applicable law or agreed to in writing, software       *
 * distributed under the License is distributed on an "AS IS" BASIS,         *
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  *
 * See the License for the specific language governing permissions and       *
 * limitations under the License.                                            *
 * ------------------------------------------------------------------------- */
import * as React from 'react'
import PropTypes from 'prop-types'

/**
 * @param root0
 * @param root0.start
 * @param root0.number
 * @param root0.duration
 */
const Count = ({ start, number, duration }) => {
  const [count, setCount] = React.useState('0')

  React.useEffect(() => {
    const end = parseInt(String(number).substring(0, 3))

    if (start === end) return

    const totalMilSecDur = parseInt(duration)
    const incrementTime = (totalMilSecDur / end) * 1000

    const timer = setInterval(() => {
      start += 1
      setCount(String(start) + String(number).substring(3))
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
