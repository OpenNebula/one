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
import { DEBUG_LEVEL } from 'client/constants'

/**
 * Returns severity type if message text includes debug level.
 *
 * @param {string} data - Message text
 * @returns {string} Severity type (debug level)
 */
export const getSeverityFromData = (data) =>
  data.includes(DEBUG_LEVEL.ERROR)
    ? DEBUG_LEVEL.ERROR
    : data.includes(DEBUG_LEVEL.INFO)
    ? DEBUG_LEVEL.INFO
    : data.includes(DEBUG_LEVEL.WARN)
    ? DEBUG_LEVEL.WARN
    : DEBUG_LEVEL.DEBUG

/**
 * Returns the message information as json.
 *
 * @param {string} data - Message information data as string
 * @returns {object} Message data
 */
export const getMessageInfo = (data = '') => {
  try {
    const { message, timestamp, severity } = JSON.parse(data)
    const decryptMessage = decodeURIComponent(escape(atob(message)))

    return { timestamp, severity, message: decryptMessage }
  } catch {
    const severity = getSeverityFromData(data)

    return { severity, message: data }
  }
}

/**
 * Returns a new log with a new message concatenated.
 *
 * @param {object} log - Current log data
 * @param {object} message - New message to concat
 * @param {string} message.command - Message's command: create, configure, etc
 * @param {string} message.commandId - Message's command id
 * @param {string} message.data - Message's information data
 * @returns {object} New log
 */
export const concatNewMessageToLog = (log, message = {}) => {
  if (typeof message !== 'object') return log

  const { data, command, commandId } = message

  if (log?.[command]?.[commandId] !== undefined) {
    log[command][commandId]?.push(data)
  } else if (log?.[command] !== undefined) {
    log[command][commandId] = [data]
  } else {
    log[command] = {
      [commandId]: [...(log?.[command]?.[commandId] ?? []), data],
    }
  }

  return { ...log }
}
