/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
const { sprintf } = require('sprintf-js')
const morgan = require('morgan')
const { defaults } = require('server/utils/constants')
const { defaultWebpackMode } = defaults

let logger = null

/**
 * Initialize logger.
 */
const initLogger = () => {
  if (global && global.paths && global.paths.FIREEDGE_LOG) {
    const trans = []

    if (env && env.NODE_ENV && env.NODE_ENV === defaultWebpackMode) {
      trans.push(
        new transports.Console({
          format: format.simple(),
        })
      )
    } else {
      trans.push(
        new transports.File({
          silent: false,
          level: 'info',
          filename: global.paths.FIREEDGE_LOG,
          handleExceptions: true,
          format: format.simple(),
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
          format: format.simple(),
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
    return morgan('combined', { stream: log.stream })
  }
}

/**
 * Write in logger.
 *
 * @param {string} message - message for logger file
 * @param {string } formatLog - message format
 */
const writeInLogger = (message = '', formatLog = '%s') => {
  const log = getLogger()
  if (log) {
    const parseMessage = Array.isArray(message) ? message : [message]
    log.info(sprintf(formatLog, ...parseMessage))
  }
}

module.exports = { initLogger, getLogger, getLoggerMiddleware, writeInLogger }
