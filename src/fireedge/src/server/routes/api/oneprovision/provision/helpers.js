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
const btoa = require('btoa')
const { parse } = require('yaml')
const { v4 } = require('uuid')
const { DateTime } = require('luxon')
const { publish } = require('server/utils/server')
const {
  httpResponse,
  existsFile,
  rotateBySize,
  executeCommand,
  executeCommandAsync,
} = require('server/utils/server')
const { defaults, httpCodes } = require('server/utils/constants')
const {
  findRecursiveFolder,
  getSpecificConfig,
} = require('server/routes/api/oneprovision/utils')

const {
  defaultCommandProvision,
  defaultEmptyFunction,
  defaultRegexpStartJSON,
  defaultRegexpEndJSON,
  defaultRegexpSplitLine,
  defaultSizeRotate,
} = defaults
const { ok, internalServerError } = httpCodes
const relName = 'provision-mapping'
const ext = 'yml'
const logFile = {
  name: 'stdouterr',
  ext: 'log',
}
const appendError = '.ERROR'

/**
 * Execute command Async and emit in WS.
 *
 * @param {string} command - command to execute
 * @param {object} actions - external functions when command emit in stderr, stdout and finalize
 * @param {Function} actions.err - emit when have stderr
 * @param {Function} actions.out - emit when have stdout
 * @param {Function} actions.close - emit when finalize
 * @param {object} dataForLog - data
 * @param {number} dataForLog.id - data id
 * @param {string} dataForLog.command - data command
 * @returns {boolean} check if emmit data
 */
const executeWithEmit = (command = [], actions = {}, dataForLog = {}) => {
  if (
    !(
      command &&
      Array.isArray(command) &&
      command.length > 0 &&
      actions &&
      dataForLog
    )
  ) {
    return
  }

  const { err: externalErr, out: externalOut, close: externalClose } = actions
  const err =
    externalErr && typeof externalErr === 'function'
      ? externalErr
      : defaultEmptyFunction
  const out =
    externalOut && typeof externalOut === 'function'
      ? externalOut
      : defaultEmptyFunction
  const close =
    externalClose && typeof externalClose === 'function'
      ? actions.close
      : defaultEmptyFunction

  // data for log
  const id = (dataForLog && dataForLog.id) || ''
  const commandName = (dataForLog && dataForLog.command) || ''

  let lastLine = ''
  const uuid = v4()

  let pendingMessages = ''

  /**
   * Emit data of command.
   *
   * @param {string} message - line of command CLI
   * @param {Function} callback - function when recieve a information
   */
  const emit = (message, callback = defaultEmptyFunction) => {
    /**
     * Publisher data to WS.
     *
     * @param {string} line - command CLI line
     */
    const publisher = (line = '') => {
      const resposeData = callback(line, uuid) || {
        id,
        data: line,
        command: commandName,
        commandId: uuid,
      }
      publish(defaultCommandProvision, resposeData)
    }

    message
      .toString()
      .split(defaultRegexpSplitLine)
      .forEach((line) => {
        if (line) {
          if (
            (defaultRegexpStartJSON.test(line) &&
              defaultRegexpEndJSON.test(line)) ||
            (!defaultRegexpStartJSON.test(line) &&
              !defaultRegexpEndJSON.test(line) &&
              pendingMessages.length === 0)
          ) {
            lastLine = line
            publisher(lastLine)
          } else if (
            (defaultRegexpStartJSON.test(line) &&
              !defaultRegexpEndJSON.test(line)) ||
            (!defaultRegexpStartJSON.test(line) &&
              !defaultRegexpEndJSON.test(line) &&
              pendingMessages.length > 0)
          ) {
            pendingMessages += line
          } else {
            lastLine = pendingMessages + line
            publisher(lastLine)
            pendingMessages = ''
          }
        }
      })
  }

  executeCommandAsync(
    defaultCommandProvision,
    command,
    getSpecificConfig('oneprovision_prepend_command'),
    {
      err: (message) => {
        emit(message, err)
      },
      out: (message) => {
        emit(message, out)
      },
      close: (success) => {
        close(success, lastLine)
      },
    }
  )

  return true
}

/**
 * Find log data.
 *
 * @param {string} id - id of provision
 * @param {boolean} fullPath - if need return the path of log
 * @returns {object} data of log
 */
const logData = (id, fullPath = false) => {
  let rtn = false
  if (!Number.isInteger(parseInt(id, 10))) {
    return rtn
  }
  const basePath = `${global.paths.CPI}/provision`
  const relFile = `${basePath}/${relName}`
  const relFileYML = `${relFile}.${ext}`
  const find = findRecursiveFolder(basePath, id)

  /**
   * Found log.
   *
   * @param {string} path - path of log
   * @param {string} uuid - uuid of log
   */
  const rtnFound = (path = '', uuid) => {
    if (!path) {
      return
    }

    const stringPath = `${path}/${logFile.name}.${logFile.ext}`
    existsFile(
      stringPath,
      (filedata) => {
        rotateBySize(stringPath, defaultSizeRotate)
        rtn = { uuid, log: filedata.split(defaultRegexpSplitLine) }
        if (fullPath) {
          rtn.fullPath = stringPath
        }
      },
      defaultEmptyFunction
    )
  }

  if (find) {
    rtnFound(find)
  } else {
    // Temporal provision
    existsFile(
      relFileYML,
      (filedata) => {
        const fileData = parse(filedata) || {}
        if (!fileData[id]) {
          return
        }

        const findPending = findRecursiveFolder(basePath, fileData[id])
        if (findPending) {
          rtnFound(findPending, fileData[id])
        } else {
          const findError = findRecursiveFolder(
            basePath,
            fileData[id] + appendError
          )
          findError && rtnFound(findError, fileData[id])
        }
      },
      defaultEmptyFunction
    )
  }

  return rtn
}

/**
 * Execute Command sync and return http response.
 *
 * @param {any[]} params - params for command.
 * @returns {object} httpResponse
 */
const addResourceSync = (params) => {
  if (!(params && Array.isArray(params))) {
    return
  }

  const executedCommand = executeCommand(
    defaultCommandProvision,
    params,
    getSpecificConfig('oneprovision_prepend_command')
  )
  try {
    const response = executedCommand.success ? ok : internalServerError

    return httpResponse(
      response,
      executedCommand.data ? JSON.parse(executedCommand.data) : params.id
    )
  } catch (error) {
    return httpResponse(internalServerError, '', executedCommand.data)
  }
}

/**
 * Executing line for provision logs.
 *
 * @param {string} message - message to log
 * @returns {string} line message stringify
 */
const executingMessage = (message = '') =>
  JSON.stringify({
    timestamp: DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss ZZZ'),
    severity: 'DEBUG',
    message: btoa(message),
  })

module.exports = {
  executeWithEmit,
  logData,
  addResourceSync,
  executingMessage,
  relName,
  ext,
  logFile,
  appendError,
}
