/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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

import { T } from '@ConstantsModule'
import { getHistoryAction, getHistoryRecords } from '@ModelsModule'

const EXECUTION_HISTORY_ACTIONS = new Set(['exec', 'exec-retry'])

/**
 * @param {object} vm - Virtual machine containing command execution history
 * @returns {object|undefined} Latest execution history record
 */
export const getLatestExecutionHistory = (vm) =>
  getHistoryRecords(vm).reduce((latestHistory, history) => {
    const action = getHistoryAction(history?.ACTION)
    const sequence = Number(history?.SEQ)
    const latestSequence = Number(latestHistory?.SEQ)

    if (!EXECUTION_HISTORY_ACTIONS.has(action) || !Number.isFinite(sequence)) {
      return latestHistory
    }

    return !latestHistory ||
      !Number.isFinite(latestSequence) ||
      sequence > latestSequence
      ? history
      : latestHistory
  }, undefined)

/**
 * @param {object} root0 - Params
 * @param {Array<number|string>} root0.elapsedTime - Elapsed value and unit
 * @param {string} root0.locale - Current locale
 * @param {Function} root0.translate - Translation function
 * @returns {string|undefined} Formatted relative time
 */
export const formatRelativeTime = ({ elapsedTime, locale, translate }) => {
  if (!elapsedTime) return undefined

  const [value, unit] = elapsedTime

  if (unit === 'second') return translate(T.JustNow)

  return new Intl.RelativeTimeFormat(locale?.replace('_', '-'), {
    numeric: 'always',
  }).format(-value, unit)
}
