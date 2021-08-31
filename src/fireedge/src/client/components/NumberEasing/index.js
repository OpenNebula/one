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
import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'

/**
 * React component for fancy number transitions.
 *
 * @param {object} props - Props
 * @param {string} props.value - The value to display at the end of the animation
 * @param {number} [props.speed] - Duration of animation effect in ms
 * @returns {string} Returns a count number
 */
const NumberEasing = ({ value = '0', speed = 200 }) => {
  const [count, setCount] = useState('0')

  useEffect(() => {
    let start = 0
    const end = parseInt(String(value).substring(0, 3))

    if (start === end) return

    const timer = setInterval(() => {
      start += 1

      setCount(String(start) + String(value).substring(3))

      if (start === end) clearInterval(timer)
    }, speed)

    return () => clearInterval(timer)
  }, [value, speed])

  return count
}

NumberEasing.propTypes = {
  value: PropTypes.string,
  speed: PropTypes.number
}

NumberEasing.displayName = 'NumberEasing'

export default NumberEasing
