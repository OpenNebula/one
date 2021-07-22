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

const { env } = require('process')
const { global } = require('window-or-global')
const winston = require('winston')
const morgan = require('morgan')
const { defaultWebpackMode } = require('./constants/defaults')

let logger = null

/**
 * Initialize logger.
 */
const initLogger = () => {
  if (global && global.paths && global.paths.FIREEDGE_LOG) {
    logger = winston.createLogger({
      transports: [
        new winston.transports.File({
          level: 'info',
          filename: global.paths.FIREEDGE_LOG,
          handleExceptions: true,
          json: true,
          maxsize: 5242880, // 5MB
          maxFiles: 5,
          colorize: false
        })
      ],
      exitOnError: false
    })

    logger.stream = {
      write: function (message, encoding) {
        logger.info(message)
      }
    }
    if (env && env.NODE_ENV && env.NODE_ENV === defaultWebpackMode) {
      logger.add(new winston.transports.Console({
        format: winston.format.simple()
      }))
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
  const logger = getLogger()
  if (logger) {
    return morgan('combined', { stream: logger.stream })
  }
}

/**
 * Write in logger.
 *
 * @param {string} message - message for logger file
 */
const writeInLogger = (message = '') => {
  const logger = getLogger()
  if (logger) {
    logger.log({
      level: 'info',
      message
    })
  }
}

module.exports = { initLogger, getLogger, getLoggerMiddleware, writeInLogger }
