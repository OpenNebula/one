/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
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
const {
  ok,
  notFound,
  accepted,
  internalServerError
} = require('server/utils/constants/http-codes')
const { httpResponse, parsePostData, existsFile } = require('server/utils/server')
const { tmpPath } = require('server/utils/constants/defaults')
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
  getFiles
} = require('./functions')
const { provision } = require('./schemas')

const httpInternalError = httpResponse(internalServerError, '', '')

const command = 'oneprovision'
const logFile = {
  name: 'stdouterr',
  ext: 'log'
}
const configFile = {
  name: 'provision',
  ext: 'yaml'
}

const getProvisionDefaults = (res = {}, next = () => undefined, params = {}) => {
  let rtn = httpInternalError
  let err = false
  const files = []
  const path = `${global.ETC_CPI}/provisions`

  const fillData = (content = '') => {
    try {
      files.push(parse(content))
    } catch (err) {
      return
    }
  }

  try {
    if (params && params.name) {
      existsFile(
        `${path}/${`${params.name}`.toLowerCase()}.yaml`,
        fillData,
        ()=>{
          err = true
        }
      )
    } else {
      getFiles(
        path, 
        'yaml'
      ).map(file =>
        existsFile(file, fillData)
      )
    }
    rtn = err? notFound : httpResponse(ok, files)
  } catch (err) {
    rtn = httpResponse(internalServerError, '', err)
  }
  res.locals.httpCode = rtn
  next()
}

const getList = (res = {}, next = () => undefined, params = {}, userData = {}) => {
  const { user, password } = userData
  let rtn = httpInternalError
  if (params && params.resource && user && password) {
    const authCommand = ['--user', user, '--password', password]
    const executedCommand = executeCommand(command, [`${params.resource}`.toLowerCase(), 'list', ...authCommand, '--json'])
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
    const authCommand = ['--user', user, '--password', password]
    let paramsCommand = ['list', ...authCommand, '--json']
    if (params && params.id) {
      paramsCommand = ['show', `${params.id}`.toLowerCase(), ...authCommand, '--json']
    }
    const executedCommand = executeCommand(command, paramsCommand)
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

const deleteResource = (res = {}, next = () => undefined, params = {}, userData = {}) => {
  const { user, password } = userData
  let rtn = httpInternalError
  if (params && params.resource && params.id && user && password) {
    const authCommand = ['--user', user, '--password', password]
    const paramsCommand = [`${params.resource}`.toLowerCase(), 'delete', `${params.id}`.toLowerCase(), ...authCommand]
    const executedCommand = executeCommand(command, paramsCommand)
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

const deleteProvision = (res = {}, next = () => undefined, params = {}, userData = {}) => {
  const { user, password } = userData
  const rtn = httpInternalError
  if (params && params.id && user && password) {
    const authCommand = ['--user', user, '--password', password]
    const paramsCommand = ['delete', params.id, '--batch', '--debug', ...authCommand]
    let lastLine = ''
    const emit = message => {
      message.toString().split(/\r|\n/).map(line=>{
        if(line){
          lastLine = line
          publish(command, { id: params.id, message: lastLine })
        }
      })
    }
    executeCommandAsync(
      command,
      paramsCommand,
      {
        err: emit,
        out: emit,
        close: success => {
          if (success) {
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
    const authCommand = ['--user', user, '--password', password]
    const paramsCommand = ['host', `${params.action}`.toLowerCase(), `${params.id}`.toLowerCase(), ...authCommand]
    const executedCommand = executeCommand(command, paramsCommand)
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

const hostCommandSSH = (res = {}, next = () => undefined, params = {}, userData = {}) => {
  const { user, password } = userData
  let rtn = httpInternalError
  if (params && params.action && params.id && params.command && user && password) {
    const authCommand = ['--user', user, '--password', password]
    const paramsCommand = ['host', `${params.action}`.toLowerCase(), `${params.id}`.toLowerCase(), `${params.command}`.toLowerCase(), ...authCommand]
    const executedCommand = executeCommand(command, paramsCommand)
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

const createProvision = (res = {}, next = () => undefined, params = {}, userData = {}) => {
  const { user, password, id } = userData
  let rtn = httpInternalError
  if (params && params.resource && user && password) {
    const authCommand = ['--user', user, '--password', password]
    const resource = parsePostData(params.resource)
    const content = createYMLContent(resource)
    if (content) {
      const files = createFolderWithFiles(`${global.CPI}/provision/${id}/tmp`, [{ name: logFile.name, ext: logFile.ext }, { name: configFile.name, ext: configFile.ext, content }])
      if (files && files.name && files.files) {
        const find = (val = '', ext = '', arr = files.files) => arr.find(e => e && e.path && e.ext && e.name && e.name === val && e.ext === ext)
        const config = find(configFile.name, configFile.ext)
        const log = find(logFile.name, logFile.ext)
        if (config && log) {
          const paramsCommand = ['create', config.path, '--batch', '--debug', '--skip-provision', ...authCommand]
          let lastLine = ''
          var stream = createWriteStream(log.path, { flags: 'a' })
          const emit = message => {
            message.toString().split(/\r|\n/).map(line=>{
              if(line){
                lastLine = line
                stream.write(`${line}\n`)
                publish(command, { id: files.name, message: line })
              }
            })
          }
          executeCommandAsync(
            command,
            paramsCommand,
            {
              err: emit,
              out: emit,
              close: success => {
                stream.end()
                if (success && /^ID: \d+/.test(lastLine)) {
                  const newPath = renameFolder(config.path, lastLine.match('\\d+'))
                  if (newPath) {
                    moveToFolder(newPath, '/../../../')
                  }
                }
                if (success === false) {
                  renameFolder(config.path, '.ERROR', 'append')
                }
              }
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
    const authCommand = ['--user', user, '--password', password]
    const paramsCommand = ['configure', params.id, '--debug', '--fail_cleanup', '--batch', ...authCommand]
    let lastLine = ''
    const emit = message => {
      message.toString().split(/\r|\n/).map(line=>{
        if(line){
          lastLine = line
          publish(command, { id: params.id, message: lastLine })
        }
      })
    }
    executeCommandAsync(
      command,
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
    const authCommand = ['--user', user, '--password', password]
    const paramsCommand = ['host', 'configure', `${params.id}`.toLowerCase(), '--debug', '--fail_cleanup', '--batch', ...authCommand]
    const executedCommand = executeCommand(command, paramsCommand)
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
    const authCommand = ['--user', user, '--password', password]
    const schemaValidator = new Validator()
    const resource = parsePostData(params.resource)
    const valSchema = schemaValidator.validate(resource, provision)
    if (valSchema.valid) {
      const content = createYMLContent(resource)
      if (content) {
        const file = createTemporalFile(tmpPath, 'yaml', content)
        if (file && file.name && file.path) {
          const paramsCommand = ['validate', '--dump', file.path, ...authCommand]
          const executedCommand = executeCommand(command, paramsCommand)
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
  const rtn = httpInternalError
  if (params && params.id) {
    console.log('PASO')
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
