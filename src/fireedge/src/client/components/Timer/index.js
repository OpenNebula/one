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
import { DateTime } from 'luxon'
import PropTypes from 'prop-types'
import { ReactElement, memo, useEffect, useMemo, useState } from 'react'

import { Translate } from 'client/components/HOC'
import { timeFromMilliseconds } from 'client/models/Helper'

const Timer = memo(
  /**
   * @param {object} config - Config
   * @param {number|string|DateTime} config.initial - Initial time
   * @param {number} [config.translateWord] - Add translate component to wrap the time
   * @param {number} [config.interval] - Interval time to update the time
   * @param {number} [config.finishAt] - Clear the interval once time is up (in ms)
   * @returns {ReactElement} Relative DateTime
   */
  ({ initial, translateWord, interval = 1000, finishAt }) => {
    /** @type {DateTime} Luxon DateTime */
    const initialValue = useMemo(() => {
      const isLuxon = initial?.isValid

      return isLuxon ? initial : timeFromMilliseconds(+initial)
    }, [initial])

    const [time, setTime] = useState(() => initialValue.toRelative())

    useEffect(() => {
      const tick = setInterval(() => {
        const newTime = initialValue.toRelative()

        if (finishAt && initialValue.millisecond === finishAt) {
          clearInterval(tick)
        }

        newTime !== time && setTime(newTime)
      }, interval)

      return () => {
        clearInterval(tick)
      }
    }, [])

    return translateWord ? (
      <Translate word={translateWord} values={[time]} />
    ) : (
      <>{time}</>
    )
  },
  (prev, next) =>
    prev.initial === next.initial && prev.translateWord === next.translateWord
)

Timer.propTypes = {
  initial: PropTypes.any,
  luxon: PropTypes.bool,
  translateWord: PropTypes.string,
  interval: PropTypes.number,
  finishAt: PropTypes.number,
}

Timer.displayName = 'Timer'

export default Timer
