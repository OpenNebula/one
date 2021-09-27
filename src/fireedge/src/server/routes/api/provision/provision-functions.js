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

const { parse } = require('yaml')
const { v4 } = require('uuid')
const { Validator } = require('jsonschema')
const { createWriteStream } = require('fs-extra')
const { lockSync, checkSync, unlockSync } = require('lockfile')
const { basename, dirname } = require('path')
const { sprintf } = require('sprintf-js')

const { Actions } = require('server/utils/constants/commands/document')
const {
  ok,
  notFound,
  accepted,
  internalServerError
} = require('server/utils/constants/http-codes')
const {
  httpResponse,
  parsePostData,
  existsFile,
  createFile,
  getDirectories,
  getFilesbyEXT
} = require('server/utils/server')
const { checkEmptyObject } = require('server/utils/general')
const {
  defaultFolderTmpProvision,
  defaultCommandProvision,
  defaultEmptyFunction,
  defaultErrorTemplate
} = require('server/utils/constants/defaults')
const {
  executeCommand,
  executeCommandAsync,
  createTemporalFile,
  createFolderWithFiles,
  createYMLContent,
  removeFile,
  renameFolder,
  moveToFolder,
  findRecursiveFolder,
  publish,
  getEndpoint,
  addOptionalCreateCommand
} = require('./functions')
const { provision } = require('./schemas')

const httpInternalError = httpResponse(internalServerError, '', '')

const logFile = {
  name: 'stdouterr',
  ext: 'log'
}
const provisionFile = {
  name: 'provision',
  ext: 'yaml'
}
const regexp = /^ID: \d+/
const regexpStartJSON = /^{/
const regexpEndJSON = /}$/
const regexpSplitLine = /\r|\n/
const relName = 'provision-mapping'
const ext = 'yml'
const appendError = '.ERROR'

/**
 * Execute command Async and emit in WS.
 *
 * @param {string} command - command to execute
 * @param {object} actions - external functions when command emit in stderr, stdout and finalize
 * @param {*} dataForLog - data
 * @returns {boolean} check if emmit data
 */
const executeWithEmit = (command = [], actions = {}, dataForLog = {}) => {
  let rtn = false
  if (
    command &&
    Array.isArray(command) &&
    command.length > 0 &&
    actions &&
    dataForLog
  ) {
    const err = actions.err && typeof actions.err === 'function' ? actions.err : defaultEmptyFunction
    const out = actions.out && typeof actions.out === 'function' ? actions.out : defaultEmptyFunction
    const close = actions.close && typeof actions.close === 'function' ? actions.close : defaultEmptyFunction

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
        const resposeData = callback(line, uuid) || { id, data: line, command: commandName, commandId: uuid }
        publish(defaultCommandProvision, resposeData)
      }

      message.toString().split(regexpSplitLine).map(line => {
        if (line) {
          if (
            (regexpStartJSON.test(line) && regexpEndJSON.test(line)) ||
            (!regexpStartJSON.test(line) && !regexpEndJSON.test(line) && pendingMessages.length === 0)
          ) {
            lastLine = line
            publisher(lastLine)
          } else if (
            (regexpStartJSON.test(line) && !regexpEndJSON.test(line)) ||
            (!regexpStartJSON.test(line) && !regexpEndJSON.test(line) && pendingMessages.length > 0)
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
      {
        err: message => {
          emit(message, err)
        },
        out: message => {
          emit(message, out)
        },
        close: success => {
          close(success, lastLine)
        }
      }
    )
    rtn = true
  }
  return rtn
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
  if (typeof id !== 'undefined') {
    const basePath = `${global.paths.CPI}/provision`
    const relFile = `${basePath}/${relName}`
    const relFileYML = `${relFile}.${ext}`
    const find = findRecursiveFolder(basePath, id)

    /**
     * Not found log.
     */
    const rtnNotFound = () => {
      rtn = false
    }

    /**
     * Found log.
     *
     * @param {string} path - path of log
     * @param {string} uuid - uuid of log
     */
    const rtnFound = (path = '', uuid) => {
      if (path) {
        const stringPath = `${path}/${logFile.name}.${logFile.ext}`
        existsFile(
          stringPath,
          filedata => {
            rtn = { uuid, log: filedata.split(regexpSplitLine) }
            if (fullPath) {
              rtn.fullPath = stringPath
            }
          },
          rtnNotFound
        )
      }
    }

    if (find) {
      rtnFound(find)
    } else {
      existsFile(
        relFileYML,
        filedata => {
          const fileData = parse(filedata) || {}
          if (fileData[id]) {
            const findPending = findRecursiveFolder(basePath, fileData[id])
            if (findPending) {
              rtnFound(findPending, fileData[id])
            } else {
              const findError = findRecursiveFolder(basePath, fileData[id] + appendError)
              if (findError) {
                rtnFound(findError, fileData[id])
              } else {
                rtnNotFound()
              }
            }
          } else {
            rtnNotFound()
          }
        },
        rtnNotFound
      )
    }
  }
  return rtn
}

/**
 * Get default provisions.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params of http request
 * @param {object} userData - user of http request
 */
const getProvisionDefaults = (res = {}, next = defaultEmptyFunction, params = {}, userData = {}) => {
  const extFiles = 'yml'
  const { user, password } = userData
  let rtn = httpInternalError
  const files = {}
  const path = `${global.paths.SHARE_CPI}`

  const endpoint = getEndpoint()
  if (user && password) {
    const authCommand = ['--user', user, '--password', password]
    const directories = getDirectories(path)
    let description = ''
    let providers = {}
    let provisions = {}
    /**
     * Fill description of provision.
     *
     * @param {string} content - content of description provision
     */
    const fillDescription = (content = '') => {
      if (content) {
        description = content
      }
    }
    /**
     * Fill providers.
     *
     * @param {string} content - content of provider
     * @param {string} name - name of provider
     */
    const fillProviders = (content = '', name = '') => {
      if (content && name) {
        if (!providers[name]) {
          providers[name] = []
        }
        try {
          providers[name].push(parse(content))
        } catch (error) {
        }
      }
    }
    /**
     * Fill provisions.
     *
     * @param {string} content - content of provision
     * @param {string} filePath - path of provision yamls
     * @param {string} path - path for command
     */
    const fillProvisions = (content = '', filePath = '', path = '') => {
      if (content && filePath && path) {
        const name = basename(filePath).replace(`.${extFiles}`, '')
        const paramsCommand = ['validate', '--dump', filePath, ...authCommand, ...endpoint]
        const executedCommand = executeCommand(defaultCommandProvision, paramsCommand, { cwd: path })
        if (executedCommand && executedCommand.success) {
          if (!provisions[name]) {
            provisions[name] = []
          }
          try {
            provisions[name].push(parse(executedCommand.data))
          } catch (err) {}
        }
      }
    }

    directories.forEach((directory = {}) => {
      if (directory.filename && directory.path) {
        // description
        existsFile(
          `${directory.path}/description.md`,
          fillDescription
        )

        // providers
        getDirectories(
          `${directory.path}/providers`
        ).map((provider = {}) => {
          if (provider.filename && provider.path) {
            getFilesbyEXT(
              provider.path,
              extFiles
            ).map(file => {
              existsFile(
                file,
                (content) => fillProviders(
                  content,
                  provider.filename
                )
              )
            })
          }
        })

        // provisions
        getFilesbyEXT(
          `${directory.path}/provisions`,
          extFiles
        ).map(file => {
          existsFile(
            file,
            (content, filePath) => fillProvisions(content, filePath, dirname(file))
          )
        })

        if (description && !checkEmptyObject(providers) && !checkEmptyObject(provisions)) {
          files[directory.filename] = {
            description,
            providers,
            provisions
          }
          // clear
          description = ''
          providers = {}
          provisions = {}
        }
      }
    })
    rtn = httpResponse(ok, files)
  }
  res.locals.httpCode = rtn
  next()
}

/**
 * Get list for resource provisions.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params of http request
 * @param {object} userData - user of http request
 */
const getListResourceProvision = (res = {}, next = defaultEmptyFunction, params = {}, userData = {}) => {
  const { user, password } = userData
  let rtn = httpInternalError
  if (params && params.resource && user && password) {
    const endpoint = getEndpoint()
    const authCommand = ['--user', user, '--password', password]
    const executedCommand = executeCommand(defaultCommandProvision, [`${params.resource}`.toLowerCase(), 'list', ...authCommand, ...endpoint, '--json'])
    try {
      const response = executedCommand.success ? ok : internalServerError
      res.locals.httpCode = httpResponse(response, JSON.parse(executedCommand.data))
      next()
      return
    } catch (error) {
      rtn = httpResponse(internalServerError, '', executedCommand.data)
    }
  }
  res.locals.httpCode = rtn
  next()
}

/**
 * Get list provisions.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params of http request
 * @param {object} userData - user of http request
 */
const getListProvisions = (res = {}, next = defaultEmptyFunction, params = {}, userData = {}) => {
  const { user, password } = userData
  let rtn = httpInternalError
  if (user && password) {
    const endpoint = getEndpoint()
    const authCommand = ['--user', user, '--password', password]
    let paramsCommand = ['list', ...authCommand, ...endpoint, '--json']
    if (params && params.id) {
      paramsCommand = ['show', `${params.id}`.toLowerCase(), ...authCommand, ...endpoint, '--json']
    }
    const executedCommand = executeCommand(defaultCommandProvision, paramsCommand)
    try {
      const response = executedCommand.success ? ok : internalServerError
      const data = JSON.parse(executedCommand.data)

      /**
       * Parse provision.TEMPLATE.BODY to JSON.
       *
       * @param {object} provision - provision
       * @returns {object} provision with TEMPLATE.BODY in JSON
       */
      const parseTemplateBody = provision => {
        if (provision && provision.TEMPLATE && provision.TEMPLATE.BODY) {
          provision.TEMPLATE.BODY = JSON.parse(provision.TEMPLATE.BODY)
        }
        return provision
      }

      if (data && data.DOCUMENT_POOL && data.DOCUMENT_POOL.DOCUMENT) {
        data.DOCUMENT_POOL.DOCUMENT = Array.isArray(data.DOCUMENT_POOL.DOCUMENT)
          ? data.DOCUMENT_POOL.DOCUMENT.map(parseTemplateBody)
          : parseTemplateBody(data.DOCUMENT_POOL.DOCUMENT)
      }
      res.locals.httpCode = httpResponse(response, data)
      next()
      return
    } catch (error) {
      rtn = httpResponse(internalServerError, '', executedCommand.data)
    }
  }
  res.locals.httpCode = rtn
  next()
}

/**
 * Delete resource provisions.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params of http request
 * @param {object} userData - user of http request
 */
const deleteResource = (res = {}, next = defaultEmptyFunction, params = {}, userData = {}) => {
  const { user, password } = userData
  let rtn = httpInternalError
  if (params && params.resource && params.id && user && password) {
    const endpoint = getEndpoint()
    const authCommand = ['--user', user, '--password', password]
    const paramsCommand = [`${params.resource}`.toLowerCase(), 'delete', `${params.id}`.toLowerCase(), ...authCommand, ...endpoint]
    const executedCommand = executeCommand(defaultCommandProvision, paramsCommand)
    try {
      const response = executedCommand.success ? ok : internalServerError
      rtn = httpResponse(response, executedCommand.data ? JSON.parse(executedCommand.data) : params.id)
    } catch (error) {
      rtn = httpResponse(internalServerError, '', executedCommand.data)
    }
  }
  res.locals.httpCode = rtn
  next()
}

/**
 * Delete provision.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params of http request
 * @param {object} userData - user of http request
 * @param {Function} oneConnection - function xmlrpc
 */
const deleteProvision = (res = {}, next = defaultEmptyFunction, params = {}, userData = {}, oneConnection = defaultEmptyFunction) => {
  const basePath = `${global.paths.CPI}/provision`
  const relFile = `${basePath}/${relName}`
  const relFileYML = `${relFile}.${ext}`
  const relFileLOCK = `${relFile}.lock`
  const { user, password } = userData
  const rtn = httpInternalError
  if (params && params.id && user && password) {
    const command = 'delete'
    const endpoint = getEndpoint()
    const authCommand = ['--user', user, '--password', password]
    const cleanup = params.cleanup ? ['--cleanup'] : []
    const paramsCommand = [command, params.id, '--batch', '--debug', '--json', ...cleanup, ...authCommand, ...endpoint]

    // get Log file
    const dataLog = logData(params.id, true)

    // create stream for write into file
    const stream = dataLog && dataLog.fullPath && createWriteStream(dataLog.fullPath, { flags: 'a' })

    /**
     * This function is performed for each command line response.
     *
     * @param {string} lastLine - last line command
     * @param {string} uuid - uuid commnand
     */
    const emit = (lastLine, uuid) => {
      const renderLine = { id: params.id, data: lastLine, command: command, commandId: uuid }
      stream && stream.write && stream.write(`${JSON.stringify(renderLine)}\n`)
    }

    /**
     * This function is only executed if the command is completed.
     *
     * @param {boolean} success - check in command complete succefully
     * @param {string} lastLine - last line command
     */
    const close = (success, lastLine) => {
      if (success) {
        stream && stream.end && stream.end()
        existsFile(
          relFileYML,
          filedata => {
            let uuid = ''
            if (!checkSync(relFileLOCK)) {
              lockSync(relFileLOCK)
              const fileData = parse(filedata) || {}
              if (fileData[params.id]) {
                uuid = fileData[params.id]
                delete fileData[params.id]
                createTemporalFile(
                  basePath,
                  ext,
                  createYMLContent(
                    Object.keys(fileData).length !== 0 && fileData.constructor === Object && fileData
                  ),
                  relName
                )
              }
              unlockSync(relFileLOCK)
              if (uuid) {
                // provisions in deploy
                const findFolder = findRecursiveFolder(`${global.paths.CPI}/provision`, uuid)
                findFolder && removeFile(findFolder)
                // provisions in error
                const findFolderERROR = findRecursiveFolder(`${global.paths.CPI}/provision`, uuid + appendError)
                findFolderERROR && removeFile(findFolderERROR)
              }
            }
          }
        )
        const findFolder = findRecursiveFolder(`${global.paths.CPI}/provision`, params.id)
        findFolder && removeFile(findFolder)
      } else {
        const connect = oneConnection(user, password)
        connect(Actions.DOCUMENT_UPDATE, [parseInt(params.id, 10), sprintf(defaultErrorTemplate, lastLine), 1], defaultEmptyFunction)
      }
    }

    // execute Async Command
    const executedCommand = executeWithEmit(
      paramsCommand,
      { close, out: emit, err: emit },
      { id: params.id, command }
    )

    // response Http
    res.locals.httpCode = httpResponse(executedCommand ? accepted : internalServerError, params.id)
    next()
    return
  }
  res.locals.httpCode = rtn
  next()
}

/**
 * Execute command of host into provision.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params of http request
 * @param {object} userData - user of http request
 */
const hostCommand = (res = {}, next = defaultEmptyFunction, params = {}, userData = {}) => {
  const { user, password } = userData
  let rtn = httpInternalError
  if (params && params.action && params.id && user && password) {
    const endpoint = getEndpoint()
    const authCommand = ['--user', user, '--password', password]
    const paramsCommand = ['host', `${params.action}`.toLowerCase(), `${params.id}`.toLowerCase(), ...authCommand, ...endpoint]
    const executedCommand = executeCommand(defaultCommandProvision, paramsCommand)
    try {
      const response = executedCommand.success ? ok : internalServerError
      res.locals.httpCode = httpResponse(response, executedCommand.data ? JSON.parse(executedCommand.data) : params.id)
      next()
      return
    } catch (error) {
      rtn = httpResponse(internalServerError, '', executedCommand.data)
    }
  }
  res.locals.httpCode = rtn
  next()
}

/**
 * SSH command of host into provision.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params of http request
 * @param {object} userData - user of http request
 */
const hostCommandSSH = (res = {}, next = defaultEmptyFunction, params = {}, userData = {}) => {
  const { user, password } = userData
  let rtn = httpInternalError
  if (params && params.action && params.id && params.command && user && password) {
    const endpoint = getEndpoint()
    const authCommand = ['--user', user, '--password', password]
    const paramsCommand = ['host', `${params.action}`.toLowerCase(), `${params.id}`.toLowerCase(), `${params.command}`.toLowerCase(), ...authCommand, ...endpoint]
    const executedCommand = executeCommand(defaultCommandProvision, paramsCommand)
    try {
      const response = executedCommand.success ? ok : internalServerError
      res.locals.httpCode = httpResponse(response, executedCommand.data ? JSON.parse(executedCommand.data) : params.id)
      next()
      return
    } catch (error) {
      rtn = httpResponse(internalServerError, '', executedCommand.data)
    }
  }
  res.locals.httpCode = rtn
  next()
}

/**
 * Create a provision.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params of http request
 * @param {object} userData - user of http request
 * @param {Function} oneConnection - function of xmlrpc
 */
const createProvision = (res = {}, next = defaultEmptyFunction, params = {}, userData = {}, oneConnection = defaultEmptyFunction) => {
  const basePath = `${global.paths.CPI}/provision`
  const relFile = `${basePath}/${relName}`
  const relFileYML = `${relFile}.${ext}`
  const relFileLOCK = `${relFile}.lock`
  const { user, password, id } = userData
  const rtn = httpInternalError
  if (params && params.resource && user && password) {
    const optionalCommand = addOptionalCreateCommand()
    const resource = parsePostData(params.resource)
    const content = createYMLContent(resource)
    if (content) {
      const command = 'create'
      const authCommand = ['--user', user, '--password', password]
      const endpoint = getEndpoint()
      const files = createFolderWithFiles(`${global.paths.CPI}/provision/${id}/tmp`, [{ name: logFile.name, ext: logFile.ext }, { name: provisionFile.name, ext: provisionFile.ext, content }])
      if (files && files.name && files.files) {
        /**
         * Find file in created files.
         *
         * @param {string} val - filename
         * @param {string} ext - file extension
         * @param {Array} arr - array of files
         * @returns {Array} path file
         */
        const find = (val = '', ext = '', arr = files.files) => arr.find(e => e && e.path && e.ext && e.name && e.name === val && e.ext === ext)

        const config = find(provisionFile.name, provisionFile.ext)
        const log = find(logFile.name, logFile.ext)
        if (config && log) {
          /**
           * Create provision.
           *
           * @param {string} filedata - provision data
           */
          const create = (filedata = '') => {
            const paramsCommand = [command, config.path, '--batch', '--debug', '--json', ...optionalCommand, ...authCommand, ...endpoint]

            // stream file log
            var stream = createWriteStream(log.path, { flags: 'a' })

            /**
             * This function is performed for each command line response.
             *
             * @param {string} lastLine - last line command
             * @param {string} uuid - UUID command
             * @returns {object} string line of command
             */
            const emit = (lastLine, uuid) => {
              if (lastLine && uuid) {
                if (regexp.test(lastLine) && !checkSync(relFileLOCK)) {
                  const fileData = parse(filedata) || {}
                  const parseID = lastLine.match('\\d+')
                  const id = parseID[0]
                  if (id && !fileData[id]) {
                    lockSync(relFileLOCK)
                    fileData[id] = files.name
                    createTemporalFile(basePath, ext, createYMLContent(fileData), relName)
                    unlockSync(relFileLOCK)
                  }
                }
                const renderLine = { id: files.name, data: lastLine, command: command, commandId: uuid }
                stream.write(`${JSON.stringify(renderLine)}\n`)
                return renderLine
              }
            }

            /**
             * This function is only executed if the command is completed.
             *
             * @param {boolean} success - check if command finish successfully
             * @param {string} lastLine - last line command finish
             */
            const close = (success, lastLine) => {
              stream.end()
              if (success && regexp.test(lastLine)) {
                const newPath = renameFolder(config.path, lastLine.match('\\d+'), 'replace')
                if (newPath) {
                  existsFile(
                    relFileYML,
                    filedata => {
                      if (!checkSync(relFileLOCK)) {
                        lockSync(relFileLOCK)
                        const fileData = parse(filedata) || {}
                        const findKey = Object.keys(fileData).find(key => fileData[key] === files.name)
                        if (findKey) {
                          delete fileData[findKey]
                          createTemporalFile(
                            basePath,
                            ext,
                            createYMLContent(
                              Object.keys(fileData).length !== 0 && fileData.constructor === Object && fileData
                            ),
                            relName
                          )
                        }
                        unlockSync(relFileLOCK)
                      }
                    }
                  )
                  moveToFolder(newPath, '/../../../')
                }
              }
              if (success === false) {
                renameFolder(config.path, appendError, 'append')
              }
            }
            executeWithEmit(
              paramsCommand,
              { close, out: emit, err: emit },
              { command }
            )
          }

          existsFile(
            relFileYML,
            filedata => {
              create(filedata)
            },
            () => {
              createFile(
                relFileYML, '', filedata => {
                  create(filedata)
                }
              )
            }
          )
          res.locals.httpCode = httpResponse(accepted, files.name)
          next()
          return
        }
      }
    }
  }
  res.locals.httpCode = rtn
  next()
}

/**
 * Configure provision.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params of http request
 * @param {object} userData - user of http request
 */
const configureProvision = (res = {}, next = defaultEmptyFunction, params = {}, userData = {}) => {
  const { user, password } = userData
  const rtn = httpInternalError
  if (params && params.id && user && password) {
    const command = 'configure'
    const endpoint = getEndpoint()
    const authCommand = ['--user', user, '--password', password]
    const paramsCommand = [command, params.id, '--debug', '--json', '--fail_cleanup', '--batch', '--force', ...authCommand, ...endpoint]

    // get Log file
    const dataLog = logData(params.id, true)

    // create stream for write into file
    const stream = dataLog && dataLog.fullPath && createWriteStream(dataLog.fullPath, { flags: 'a' })

    /**
     * This function is performed for each command line response.
     *
     * @param {string} lastLine - last line command
     * @param {string} uuid - UUID command
     */
    const emit = (lastLine, uuid) => {
      const renderLine = { id: params.id, data: lastLine, command: command, commandId: uuid }
      stream && stream.write && stream.write(`${JSON.stringify(renderLine)}\n`)
    }

    /**
     * This function is only executed if the command is completed.
     *
     * @param {boolean} success - check if command complete without errors
     * @param {string} lastLine - last line command
     */
    const close = (success, lastLine) => {
      stream && stream.end && stream.end()
    }

    // execute Async Command
    const executedCommand = executeWithEmit(
      paramsCommand,
      { close, out: emit, err: emit },
      { id: params.id, command }
    )

    // response Http
    res.locals.httpCode = httpResponse(executedCommand ? accepted : internalServerError, params.id)
    next()
    return
  }
  res.locals.httpCode = rtn
  next()
}

/**
 * Configure host provision.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params of http request
 * @param {object} userData - user of http request
 */
const configureHost = (res = {}, next = defaultEmptyFunction, params = {}, userData = {}) => {
  const { user, password } = userData
  const rtn = httpInternalError
  if (params && params.id && user && password) {
    const command = 'configure'
    const endpoint = getEndpoint()
    const authCommand = ['--user', user, '--password', password]
    const paramsCommand = ['host', command, `${params.id}`.toLowerCase(), '--debug', '--fail_cleanup', '--batch', ...authCommand, ...endpoint]

    // get Log file
    const dataLog = logData(params.id, true)

    // create stream for write into file
    const stream = dataLog && dataLog.fullPath && createWriteStream(dataLog.fullPath, { flags: 'a' })

    /**
     * This function is performed for each command line response.
     *
     * @param {string} lastLine - last line command
     * @param {string} uuid - uuid command
     */
    const emit = (lastLine, uuid) => {
      const renderLine = { id: params.id, data: lastLine, command: `host ${command}`, commandId: uuid }
      stream && stream.write && stream.write(`${JSON.stringify(renderLine)}\n`)
    }

    /**
     * This function is only executed if the command is completed.
     *
     * @param {boolean} success - check if command complete without error
     * @param {string} lastLine - last line command
     */
    const close = (success, lastLine) => {
      stream && stream.end && stream.end()
    }

    // execute Async Command
    const executedCommand = executeWithEmit(
      paramsCommand,
      { close, out: emit, err: emit },
      { id: params.id, command: `host ${command}` }
    )

    // response Http
    res.locals.httpCode = httpResponse(executedCommand ? accepted : internalServerError, params.id)
    next()
    return
  }
  res.locals.httpCode = rtn
  next()
}

/**
 * Validate provision file.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params of http request
 * @param {object} userData - user of http request
 */
const validate = (res = {}, next = defaultEmptyFunction, params = {}, userData = {}) => {
  const { user, password } = userData
  let rtn = httpInternalError
  if (params && params.resource && user && password) {
    const endpoint = getEndpoint()
    const authCommand = ['--user', user, '--password', password]
    const schemaValidator = new Validator()
    const resource = parsePostData(params.resource)
    const valSchema = schemaValidator.validate(resource, provision)
    if (valSchema.valid) {
      const content = createYMLContent(resource)
      if (content) {
        const file = createTemporalFile(`${global.paths.CPI}/${defaultFolderTmpProvision}`, 'yaml', content)
        if (file && file.name && file.path) {
          const paramsCommand = ['validate', '--dump', file.path, ...authCommand, ...endpoint]
          const executedCommand = executeCommand(defaultCommandProvision, paramsCommand)
          let response = internalServerError
          if (executedCommand && executedCommand.success) {
            response = ok
          }
          removeFile(file)
          res.locals.httpCode = httpResponse(response)
          next()
          return
        }
      }
    } else {
      const errors = []
      if (valSchema && valSchema.errors) {
        valSchema.errors.forEach(error => {
          errors.push(error.stack.replace(/^instance./, ''))
        })
        rtn = httpResponse(internalServerError, '', errors.toString())
      }
    }
  }
  res.locals.httpCode = rtn
  next()
}

/**
 * Get provision log.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params of http request
 */
const getLogProvisions = (res = {}, next = defaultEmptyFunction, params = {}) => {
  let rtn = httpInternalError
  if (params && params.id) {
    const foundLogs = logData(params.id)
    if (foundLogs) {
      rtn = httpResponse(ok, foundLogs)
    } else {
      rtn = notFound
    }
  }
  res.locals.httpCode = rtn
  next()
}

const provisionFunctionsApi = {
  getProvisionDefaults,
  getLogProvisions,
  getListResourceProvision,
  getListProvisions,
  deleteResource,
  deleteProvision,
  hostCommand,
  hostCommandSSH,
  createProvision,
  configureProvision,
  configureHost,
  validate
}
module.exports = provisionFunctionsApi
