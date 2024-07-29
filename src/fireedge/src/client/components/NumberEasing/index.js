/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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

const TOTAL_PROGRESS = 1

/**
 * React component for fancy number transitions.
 *
 * @param {object} props - Props
 * @param {string|number} props.value - The value to display at the end of the animation
 * @param {number} [props.start] - The value to display at the start of the animation
 * @param {number} [props.duration] - Duration of animation effect in ms
 * @returns {string} Returns a count number
 */
const NumberEasing = ({ value = 0, start = 0, duration = 1500 }) => {
  const [count, setCount] = useState(start)

  useEffect(() => {
    let startTimestamp = null
    let animation = null

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp

      const leftTime = (timestamp - startTimestamp) / duration

      // Math.min() is used here to make sure
      // the element stops animating when the duration is reached
      const progress = Math.min(leftTime, TOTAL_PROGRESS)

      setCount(Math.floor(progress * (value - start) + start))

      if (progress < 1) animation = window.requestAnimationFrame(step)
    }

    animation = window.requestAnimationFrame(step)

    return () => window.cancelAnimationFrame(animation)
  }, [value])

  return count
}

NumberEasing.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  start: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  duration: PropTypes.number,
}

NumberEasing.displayName = 'NumberEasing'

export default NumberEasing
