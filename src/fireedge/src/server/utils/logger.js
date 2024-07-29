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

const { env } = require('process')
const { global } = require('window-or-global')
const { transports, format, createLogger } = require('winston')
const { printf } = format
const { sprintf } = require('sprintf-js')
const morgan = require('morgan')
const _ = require('lodash')
const { defaults } = require('server/utils/constants')
const { defaultWebpackMode, defaultLogsLevels, defaultLogMessageLength } =
  defaults

let logger = null

const getTruncFormat = (truncateMaxLength) =>
  printf(({ timestamp, level, message }) => {
    const formattedMessage =
      truncateMaxLength === -1
        ? message
        : _.truncate(message, { length: truncateMaxLength })

    return `[${timestamp}] - [${level}] ${formattedMessage}`
  })

/**
 * Initialize logger.
 *
 * @param {number} logLevel - log level
 * @param {number} truncate_max_limit - max limit to truncate log messages
 */
const initLogger = (
  logLevel = 0,
  truncate_max_limit = defaultLogMessageLength
) => {
  if (global && global.paths && global.paths.FIREEDGE_LOG) {
    const levelString = parseInt(logLevel, 10)
    const logString = defaultLogsLevels && defaultLogsLevels[levelString]

    const trans = []

    const loggerFormat = format.combine(
      format.timestamp(),
      getTruncFormat(truncate_max_limit)
    )

    if (env && env.NODE_ENV && env.NODE_ENV === defaultWebpackMode) {
      trans.push(
        new transports.Console({
          format: loggerFormat,
        })
      )
    } else {
      trans.push(
        new transports.File({
          silent: false,
          level: logString,
          filename: global.paths.FIREEDGE_LOG,
          handleExceptions: true,
          format: loggerFormat,
          maxsize: 5242880, // 5MB
          colorize: false,
        })
      )
    }

    logger = createLogger({
      transports: trans,
      exitOnError: false,
    })

    logger.stream = {
      write: (message = '') => {
        writeInLogger(message)
      },
    }

    if (env && env.NODE_ENV && env.NODE_ENV === defaultWebpackMode) {
      logger.clear().add(
        new transports.Console({
          format: loggerFormat,
        })
      )
    }
  }
}

/**
 * Get logger.
 *
 * @returns {object} - logger
 */
const getLogger = () => logger

/**
 * Get Logger middleware.
 *
 * @returns {object} - morgan middleware
 */
const getLoggerMiddleware = () => {
  const log = getLogger()
  if (log && log.stream) {
    return morgan('combined', {
      stream: log.stream,
      skip: function (req, res) {
        return res.statusCode < 400
      },
    })
  }
}

/**
 * Write in logger.
 *
 * @param {string} message - message for logger file
 * @param {object} optLog - message format
 * @param {string} optLog.format - Message format. By default is '%s'
 * @param {number} optLog.level - Log debug level. By default is 0
 */
const writeInLogger = (message = '', optLog = {}) => {
  const { format: formatLogger = '%s', level = 0 } = optLog
  const logString = defaultLogsLevels && defaultLogsLevels[level]
  const log = getLogger()
  if (log) {
    const parseMessage = Array.isArray(message) ? message : [message]
    log[logString](sprintf(formatLogger, ...parseMessage))
  }
}

/**
 * Write in logger when XMLRPC is invalid.
 *
 * @param {string} rpc - XMLRPC URL
 */
const writeInLoggerInvalidRPC = (rpc = '') => {
  !/^(http|https):\/\/[^ "]+$/.test(rpc) &&
    writeInLogger(rpc, {
      format: 'XMLRPC is not a URL valid: %s',
      level: 2,
    })
}

module.exports = {
  initLogger,
  getLogger,
  getLoggerMiddleware,
  writeInLogger,
  writeInLoggerInvalidRPC,
}
