/* Copyright 2002-2021, OpenNebula Project, OpenNebula Systems                */
/*                                                                            */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may    */
/* not use this file except in compliance with the License. You may obtain    */
/* a copy of the License at                                                   */
/*                                                                            */
/* http://www.apache.org/licenses/LICENSE-2.0                                 */
/*                                                                            */
/* Unless required by applicable law or agreed to in writing, software        */
/* distributed under the License is distributed on an "AS IS" BASIS,          */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   */
/* See the License for the specific language governing permissions and        */
/* limitations under the License.                                             */
/* -------------------------------------------------------------------------- */

const { parse } = require('yaml')
const { v4 } = require('uuid')
const { Validator } = require('jsonschema')
const { createWriteStream } = require('fs-extra')
const { lockSync, checkSync, unlockSync } = require('lockfile')
const { basename, dirname } = require('path')
const {
  ok,
  notFound,
  accepted,
  internalServerError
} = require('server/utils/constants/http-codes')
const { httpResponse, parsePostData, existsFile, createFile } = require('server/utils/server')
const { tmpPath, defaultCommandProvision } = require('server/utils/constants/defaults')
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
  getFiles,
  getDirectories,
  getEndpoint,
  addOptionalCreateCommand
} = require('./functions')
const { provision } = require('./schemas')

const httpInternalError = httpResponse(internalServerError, '', '')

const logFile = {
  name: 'stdouterr',
  ext: 'log'
}
const configFile = {
  name: 'provision',
  ext: 'yaml'
}
const regexp = /^ID: \d+/
const relName = 'provision-mapping'
const ext = 'yml'
const appendError = '.ERROR'

const executeWithEmit = (command = [], actions = {}, id = '') => {
  let rtn = false
  if (
    command &&
    Array.isArray(command) &&
    command.length > 0 &&
    actions
  ) {
    const err = actions.err && typeof actions.err === 'function' ? actions.err : () => undefined
    const out = actions.out && typeof actions.out === 'function' ? actions.out : () => undefined
    const close = actions.close && typeof actions.close === 'function' ? actions.close : () => undefined

    let lastLine = ''
    const uuid = v4()

    // send data of command
    const emit = (message, callback = () => undefined) => {
      message.toString().split(/\r|\n/).map(line => {
        if (line) {
          lastLine = line
          const resposeData = callback(lastLine, uuid) || { id, data: lastLine, command: command, commandId: uuid }
          publish(defaultCommandProvision, resposeData)
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

const logData = (id, fullPath = false) => {
  let rtn = false
  if (typeof id !== 'undefined') {
    const basePath = `${global.CPI}/provision`
    const relFile = `${basePath}/${relName}`
    const relFileYML = `${relFile}.${ext}`
    const find = findRecursiveFolder(basePath, id)
    const rtnNotFound = () => {
      rtn = false
    }
    const rtnFound = (path = '', uuid) => {
      if (path) {
        const stringPath = `${path}/${logFile.name}.${logFile.ext}`
        existsFile(
          stringPath,
          filedata => {
            rtn = { uuid, log: filedata.split(/\r|\n/) }
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

const getProvisionDefaults = (res = {}, next = () => undefined, params = {}, userData = {}) => {
  const extFiles = 'yml'
  const { user, password } = userData
  let rtn = httpInternalError
  const files = {}
  const path = `${global.SHARE_CPI}`
  const checkEmpty = (obj = {}) =>
    Object.keys(obj).length === 0 && obj.constructor === Object

  const endpoint = getEndpoint()
  if (user && password) {
    const authCommand = ['--user', user, '--password', password]
    const directories = getDirectories(path)
    let description = ''
    const providers = {}
    const provisions = {}
    const fillDescription = (content = '') => {
      if (content) {
        description = content
      }
    }
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
          `${directory.path}/description.txt`,
          fillDescription
        )

        // providers
        getDirectories(
          `${directory.path}/providers`
        ).map((provider = {}) => {
          if (provider.filename && provider.path) {
            getFiles(
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
        getFiles(
          `${directory.path}/provisions`,
          extFiles
        ).map(file => {
          existsFile(
            file,
            (content, filePath) => fillProvisions(content, filePath, dirname(file))
          )
        })
        if (description && !checkEmpty(providers) && !checkEmpty(provisions)) {
          files[directory.filename] = {
            description,
            providers,
            provisions
          }
        }
      }
    })
    rtn = httpResponse(ok, files)
  }
  res.locals.httpCode = rtn
  next()
}

const getList = (res = {}, next = () => undefined, params = {}, userData = {}) => {
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

const getListProvisions = (res = {}, next = () => undefined, params = {}, userData = {}) => {
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
      if (data && data.DOCUMENT_POOL && data.DOCUMENT_POOL.DOCUMENT && Array.isArray(data.DOCUMENT_POOL.DOCUMENT)) {
        data.DOCUMENT_POOL.DOCUMENT = data.DOCUMENT_POOL.DOCUMENT.map(provision => {
          if (provision && provision.TEMPLATE && provision.TEMPLATE.BODY) {
            provision.TEMPLATE.BODY = JSON.parse(provision.TEMPLATE.BODY)
          }
          return provision
        })
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

const deleteResource = (res = {}, next = () => undefined, params = {}, userData = {}) => {
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

const deleteProvision = (res = {}, next = () => undefined, params = {}, userData = {}) => {
  const basePath = `${global.CPI}/provision`
  const relFile = `${basePath}/${relName}`
  const relFileYML = `${relFile}.${ext}`
  const relFileLOCK = `${relFile}.lock`
  const { user, password } = userData
  const rtn = httpInternalError
  if (params && params.id && user && password) {
    const command = 'delete'
    const endpoint = getEndpoint()
    const authCommand = ['--user', user, '--password', password]
    const paramsCommand = [command, params.id, '--batch', '--debug', '--json', ...authCommand, ...endpoint]

    // get Log file
    const dataLog = logData(params.id, true)

    // create stream for write into file
    const stream = dataLog && dataLog.fullPath && createWriteStream(dataLog.fullPath, { flags: 'a' })

    // This function is performed for each command line response
    const emit = (lastLine, uuid) => {
      const renderLine = { id: params.id, data: lastLine, command: command, commandId: uuid }
      stream && stream.write && stream.write(`${JSON.stringify(renderLine)}\n`)
    }

    // This function is only executed if the command is completed
    const close = success => {
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
                const findFolder = findRecursiveFolder(`${global.CPI}/provision`, uuid)
                findFolder && removeFile(findFolder)
                // provisions in error
                const findFolderERROR = findRecursiveFolder(`${global.CPI}/provision`, uuid + appendError)
                findFolderERROR && removeFile(findFolderERROR)
              }
            }
          }
        )
        const findFolder = findRecursiveFolder(`${global.CPI}/provision`, params.id)
        findFolder && removeFile(findFolder)
      }
    }

    // execute Async Command
    const executedCommand = executeWithEmit(paramsCommand, { close, out: emit, err: emit }, params.id)

    // response Http
    res.locals.httpCode = httpResponse(executedCommand ? accepted : internalServerError, params.id)
    next()
    return
  }
  res.locals.httpCode = rtn
  next()
}

const hostCommand = (res = {}, next = () => undefined, params = {}, userData = {}) => {
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

const hostCommandSSH = (res = {}, next = () => undefined, params = {}, userData = {}) => {
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

const createProvision = (res = {}, next = () => undefined, params = {}, userData = {}) => {
  const basePath = `${global.CPI}/provision`
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
      const files = createFolderWithFiles(`${global.CPI}/provision/${id}/tmp`, [{ name: logFile.name, ext: logFile.ext }, { name: configFile.name, ext: configFile.ext, content }])
      if (files && files.name && files.files) {
        const find = (val = '', ext = '', arr = files.files) => arr.find(e => e && e.path && e.ext && e.name && e.name === val && e.ext === ext)
        const config = find(configFile.name, configFile.ext)
        const log = find(logFile.name, logFile.ext)
        if (config && log) {
          const create = (filedata = '') => {
            const paramsCommand = [command, config.path, '--batch', '--debug', '--json', ...optionalCommand, ...authCommand, ...endpoint]

            // stream file log
            var stream = createWriteStream(log.path, { flags: 'a' })

            // This function is performed for each command line response
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

            // This function is only executed if the command is completed
            const close = (success, lastLine) => {
              stream.end()
              if (success && regexp.test(lastLine)) {
                const newPath = renameFolder(config.path, lastLine.match('\\d+'))
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

            executeWithEmit(paramsCommand, { close, out: emit, err: emit })
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

const configureProvision = (res = {}, next = () => undefined, params = {}, userData = {}) => {
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

    // This function is performed for each command line response
    const emit = (lastLine, uuid) => {
      const renderLine = { id: params.id, data: lastLine, command: command, commandId: uuid }
      stream && stream.write && stream.write(`${JSON.stringify(renderLine)}\n`)
    }

    const close = (success, lastLine) => {
      stream && stream.end && stream.end()
    }

    // execute Async Command
    const executedCommand = executeWithEmit(paramsCommand, { close, out: emit, err: emit }, params.id)

    // response Http
    res.locals.httpCode = httpResponse(executedCommand ? accepted : internalServerError, params.id)
    next()
    return
  }
  res.locals.httpCode = rtn
  next()
}

const configureHost = (res = {}, next = () => undefined, params = {}, userData = {}) => {
  const { user, password } = userData
  let rtn = httpInternalError
  if (params && params.id && user && password) {
    const endpoint = getEndpoint()
    const authCommand = ['--user', user, '--password', password]
    const paramsCommand = ['host', 'configure', `${params.id}`.toLowerCase(), '--debug', '--fail_cleanup', '--batch', ...authCommand, ...endpoint]

    const executedCommand = executeCommand(defaultCommandProvision, paramsCommand)
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

const validate = (res = {}, next = () => undefined, params = {}, userData = {}) => {
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
        const file = createTemporalFile(tmpPath, 'yaml', content)
        if (file && file.name && file.path) {
          const paramsCommand = ['validate', '--dump', file.path, ...authCommand, ...endpoint]
          const executedCommand = executeCommand(defaultCommandProvision, paramsCommand)
          let response = internalServerError
          if (executedCommand && executedCommand.success) {
            response = ok
            removeFile(file)
          }
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

const getLogProvisions = (res = {}, next = () => undefined, params = {}) => {
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
  getList,
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
