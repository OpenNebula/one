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
  getEndpoint
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
    const endpoint = getEndpoint()
    const authCommand = ['--user', user, '--password', password]
    const paramsCommand = ['delete', params.id, '--batch', '--debug', ...authCommand, ...endpoint]
    let lastLine = ''
    const emit = message => {
      message.toString().split(/\r|\n/).map(line => {
        if (line) {
          lastLine = line
          publish(defaultCommandProvision, { id: params.id, message: lastLine })
        }
      })
    }
    executeCommandAsync(
      defaultCommandProvision,
      paramsCommand,
      {
        err: emit,
        out: emit,
        close: success => {
          if (success) {
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
      }
    )
    res.locals.httpCode = httpResponse(accepted, params.id)
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
    const authCommand = ['--user', user, '--password', password]
    const endpoint = getEndpoint()
    const resource = parsePostData(params.resource)
    const content = createYMLContent(resource)
    if (content) {
      const files = createFolderWithFiles(`${global.CPI}/provision/${id}/tmp`, [{ name: logFile.name, ext: logFile.ext }, { name: configFile.name, ext: configFile.ext, content }])
      if (files && files.name && files.files) {
        const find = (val = '', ext = '', arr = files.files) => arr.find(e => e && e.path && e.ext && e.name && e.name === val && e.ext === ext)
        const config = find(configFile.name, configFile.ext)
        const log = find(logFile.name, logFile.ext)
        if (config && log) {
          const create = (filedata = '') => {
            const paramsCommand = ['create', config.path, '--batch', '--debug', '--skip-provision', ...authCommand, ...endpoint]
            let lastLine = ''
            var stream = createWriteStream(log.path, { flags: 'a' })
            const emit = message => {
              message.toString().split(/\r|\n/).map(line => {
                if (line) {
                  if (regexp.test(line) && !checkSync(relFileLOCK)) {
                    const fileData = parse(filedata) || {}
                    const parseID = line.match('\\d+')
                    const id = parseID[0]
                    if (id && !fileData[id]) {
                      lockSync(relFileLOCK)
                      fileData[id] = files.name
                      createTemporalFile(basePath, ext, createYMLContent(fileData), relName)
                      unlockSync(relFileLOCK)
                    }
                  }
                  lastLine = line
                  stream.write(`${line}\n`)
                  publish(defaultCommandProvision, { id: files.name, message: line })
                }
              })
            }
            executeCommandAsync(
              defaultCommandProvision,
              paramsCommand,
              {
                err: emit,
                out: emit,
                close: success => {
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
              }
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

const configureProvision = (res = {}, next = () => undefined, params = {}, userData = {}) => {
  const { user, password } = userData
  const rtn = httpInternalError
  if (params && params.id && user && password) {
    const endpoint = getEndpoint()
    const authCommand = ['--user', user, '--password', password]
    const paramsCommand = ['configure', params.id, '--debug', '--fail_cleanup', '--batch', ...authCommand, ...endpoint]
    let lastLine = ''
    const emit = message => {
      message.toString().split(/\r|\n/).map(line => {
        if (line) {
          lastLine = line
          publish(defaultCommandProvision, { id: params.id, message: lastLine })
        }
      })
    }
    executeCommandAsync(
      defaultCommandProvision,
      paramsCommand,
      {
        err: emit,
        out: emit
      }
    )
    res.locals.httpCode = httpResponse(accepted, params.id)
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
  const basePath = `${global.CPI}/provision`
  const path = `${global.CPI}/provision`
  const relFile = `${basePath}/${relName}`
  const relFileYML = `${relFile}.${ext}`
  let rtn = httpInternalError
  if (params && params.id) {
    const find = findRecursiveFolder(path, params.id)
    const rtnNotFound = () => {
      rtn = notFound
    }
    const rtnFound = (path = '', uuid) => {
      if (path) {
        existsFile(
          `${path}/${logFile.name}.${logFile.ext}`,
          filedata => {
            rtn = httpResponse(ok, { uuid, log: filedata.split(/\r|\n/) })
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
          if (fileData[params.id]) {
            const findPending = findRecursiveFolder(path, fileData[params.id])
            if (findPending) {
              rtnFound(findPending, fileData[params.id])
            } else {
              const findError = findRecursiveFolder(path, fileData[params.id] + appendError)
              if (findError) {
                rtnFound(findError, fileData[params.id])
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
