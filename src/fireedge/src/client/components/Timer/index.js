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
import { ReactElement, useMemo, memo, useState, useEffect } from 'react'
import { DateTime } from 'luxon'

import { Translate } from 'client/components/HOC'
import { timeFromMilliseconds } from 'client/models/Helper'

const Timer = memo(
  /**
   * @param {object} config - Config
   * @param {number|string|DateTime} config.initial - Initial time
   * @param {boolean} [config.luxon] - If `true`, the time will be a parsed as luxon DateTime
   * @param {number} [config.translateWord] - Add translate component to wrap the time
   * @param {number} [config.interval] - Interval time to update the time
   * @param {number} [config.finishAt] - Clear the interval once time is up (in ms)
   * @returns {ReactElement} Relative DateTime
   */
  ({ initial, luxon, translateWord, interval = 1000, finishAt }) => {
    const [time, setTime] = useState('...')

    useEffect(() => {
      const isLuxon = luxon || initial?.isValid
      const initialValue = isLuxon ? initial : timeFromMilliseconds(+initial)

      const tick = setInterval(() => {
        const newTime = initialValue.toRelative()

        console.log({ ms: initialValue.millisecond, finishAt })
        if (finishAt && initialValue.millisecond === finishAt) {
          clearInterval(tick)
        }

        newTime !== time && setTime(newTime)
      }, interval)

      return () => {
        clearInterval(tick)
      }
    }, [])

    if (translateWord) {
      return <Translate word={translateWord} values={[time]} />
    }

    return <>{time}</>
  },
  (prev, next) =>
    prev.initial === next.initial && prev.translateWord === next.translateWord
)

/* const Timer = memo(({ initial, luxon, translateWord, interval = 1000 }) => {
  const ensuredInitial = useMemo(() => {
    const isLuxon = luxon || initial?.isValid
    const val = isLuxon ? initial : timeFromMilliseconds(+initial)
  
    return val.toRelative()  
  }, [])

  const [timer, setTimer] = useState(() => ensuredInitial)

  useEffect(() => {
    const tick = setInterval(() => {
      const newTimer = DateTime.local().toRelative()

      newTimer !== timer && setTimer(newTimer)
    }, interval)

    return () => {
      clearInterval(tick)
    }
  }, [])

  /*   if (translateWord) {
    return <Translate word={translateWord} values={[timer]} />
  }

  return <>{timer}</>
}) */

Timer.displayName = 'Timer'

export default Timer
