import { DEBUG_LEVEL } from 'client/constants'

/**
 * Returns severity type if message text includes debug level
 * @param {string} data - Message text
 * @returns {string} Severity type (debug level)
 */
export const getSeverityFromData = data =>
  data.includes(DEBUG_LEVEL.ERROR)
    ? DEBUG_LEVEL.ERROR
    : data.includes(DEBUG_LEVEL.INFO)
      ? DEBUG_LEVEL.INFO
      : data.includes(DEBUG_LEVEL.WARN)
        ? DEBUG_LEVEL.WARN
        : DEBUG_LEVEL.DEBUG

/**
 * Returns the message information as json
 * @param {string} data - Message information data as string
 * @returns {object} Message data
 */
export const getMessageInfo = (data = '') => {
  try {
    const { message, timestamp, severity } = JSON.parse(data)
    const decryptMessage = atob(message)

    return { timestamp, severity, message: decryptMessage }
  } catch {
    const severity = getSeverityFromData(data)

    return { severity, message: data }
  }
}

/**
 * Returns a new log with a new message concatenated
 * @param {array} log - Current log data
 * @param {object} message - New message to concat
 * @param {string} message.command - Message's command: create, configure, etc
 * @param {string} message.commandId - Message's command id
 * @param {string} message.data - Message's information data
 * @returns {array} New log
 */
export const concatNewMessageToLog = (log, message = {}) => {
  if (typeof message !== 'object') return log

  const { data, command, commandId } = message

  return {
    ...log,
    [command]: {
      [commandId]: [...(log?.[command]?.[commandId] ?? []), data]
    }
  }
}
