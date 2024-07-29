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

const { parse } = require('yaml')
const { Validator } = require('jsonschema')
const { createWriteStream } = require('fs-extra')
const { lockSync, checkSync, unlockSync } = require('lockfile')
const { basename, dirname } = require('path')
const { sprintf } = require('sprintf-js')

const { Actions } = require('server/utils/constants/commands/document')
const { defaults, httpCodes } = require('server/utils/constants')
const {
  httpResponse,
  parsePostData,
  existsFile,
  createFile,
  getDirectories,
  getFilesbyEXT,
  executeCommand,
  removeFile,
} = require('server/utils/server')
const { checkEmptyObject } = require('server/utils/general')
const {
  createTemporalFile,
  createFolderWithFiles,
  createYMLContent,
  renameFolder,
  moveToFolder,
  findRecursiveFolder,
  getEndpoint,
  addOptionalCreateCommand,
  getSpecificConfig,
} = require('server/routes/api/oneprovision/utils')
const { provision } = require('server/routes/api/oneprovision/schemas')
const {
  executeWithEmit,
  logData,
  addResourceSync,
  relName,
  ext,
  logFile,
  appendError,
  executingMessage,
} = require('server/routes/api/oneprovision/provision/helpers')

const {
  defaultFolderTmpProvision,
  defaultCommandProvision,
  defaultEmptyFunction,
  defaultErrorTemplate,
  defaultRegexID,
} = defaults
const { ok, notFound, accepted, internalServerError } = httpCodes
const httpInternalError = httpResponse(internalServerError, '', '')

const provisionFile = {
  name: 'provision',
  ext: 'yaml',
}
const messageExecuting = 'Executing command:'

const optionalParameters = ['--debug', '--json', '--batch']

/**
 * Get default provisions (Sync route).
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params of http request
 * @param {object} userData - user of http request
 * @param {string} userData.user - username
 * @param {string} userData.password - password
 */
const getProvisionDefaults = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const extFiles = 'yml'
  const { user, password } = userData
  const files = {}
  const path = `${global.paths.SHARE_CPI}`
  const endpoint = getEndpoint()
  if (!(user && password)) {
    res.locals.httpCode = httpInternalError
    next()

    return
  }

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
      } catch (error) {}
    }
  }
  /**
   * Fill provisions.
   *
   * @param {string} content - content of provision
   * @param {string} filePath - path of provision yamls
   * @param {string} pathCli - path for command
   */
  const fillProvisions = (content = '', filePath = '', pathCli = '') => {
    if (content && filePath && path) {
      const name = basename(filePath).replace(`.${extFiles}`, '')
      const paramsCommand = [
        'validate',
        '--dump',
        filePath,
        ...authCommand,
        ...endpoint,
      ]
      const executedCommand = executeCommand(
        defaultCommandProvision,
        paramsCommand,
        getSpecificConfig('oneprovision_prepend_command'),
        { cwd: pathCli }
      )
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
      existsFile(`${directory.path}/description.md`, fillDescription)

      // providers
      getDirectories(`${directory.path}/providers`).forEach((provider = {}) => {
        if (provider.filename && provider.path) {
          getFilesbyEXT(provider.path, extFiles).forEach((file) => {
            existsFile(file, (content) =>
              fillProviders(content, provider.filename)
            )
          })
        }
      })

      // provisions
      getFilesbyEXT(`${directory.path}/provisions`, extFiles).forEach(
        (file) => {
          existsFile(file, (content, filePath) =>
            fillProvisions(content, filePath, dirname(file))
          )
        }
      )

      if (
        description &&
        !checkEmptyObject(providers) &&
        !checkEmptyObject(provisions)
      ) {
        files[directory.filename] = {
          description,
          providers,
          provisions,
        }
        // clear
        description = ''
        providers = {}
        provisions = {}
      }
    }
  })
  res.locals.httpCode = httpResponse(ok, files)
  next()
}

/**
 * Get list for resource provisions (Sync route).
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params of http request
 * @param {string} params.resource - resource provision
 * @param {object} userData - user of http request
 * @param {string} userData.user - username
 * @param {string} userData.password - user password
 */
const getListResourceProvision = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { user, password } = userData
  const { resource } = params
  if (!(resource && user && password)) {
    res.locals.httpCode = httpInternalError
    next()

    return
  }

  const endpoint = getEndpoint()
  const authCommand = ['--user', user, '--password', password]
  const paramsCommand = [
    `${resource}`.toLowerCase(),
    'list',
    ...authCommand,
    ...endpoint,
    '--json',
  ]
  const executedCommand = executeCommand(
    defaultCommandProvision,
    paramsCommand,
    getSpecificConfig('oneprovision_prepend_command')
  )
  try {
    const response = executedCommand.success ? ok : internalServerError
    res.locals.httpCode = httpResponse(
      response,
      JSON.parse(executedCommand.data)
    )
    next()
  } catch (error) {
    res.locals.httpCode = httpResponse(
      internalServerError,
      '',
      executedCommand.data
    )
    next()
  }
}

/**
 * Get list provisions (Sync route).
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params of http request
 * @param {number} params.id - provision id
 * @param {object} userData - user of http request
 * @param {string} userData.user - username
 * @param {string} userData.password - user password
 */
const getListProvisions = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { user, password } = userData
  const { id } = params
  if (!(user && password)) {
    res.locals.httpCode = httpInternalError
    next()
  }
  const endpoint = getEndpoint()
  const authCommand = ['--user', user, '--password', password]
  let paramsCommand = ['list', ...authCommand, ...endpoint, '--json']
  if (Number.isInteger(parseInt(id, 10))) {
    paramsCommand = [
      'show',
      `${id}`.toLowerCase(),
      ...authCommand,
      ...endpoint,
      '--json',
    ]
  }
  const executedCommand = executeCommand(
    defaultCommandProvision,
    paramsCommand,
    getSpecificConfig('oneprovision_prepend_command')
  )
  try {
    const response = executedCommand.success ? ok : internalServerError
    const data = JSON.parse(executedCommand.data)

    /**
     * Parse provision.TEMPLATE.BODY to JSON.
     *
     * @param {object} oneProvision - provision
     * @returns {object} provision with TEMPLATE.BODY in JSON
     */
    const parseTemplateBody = (oneProvision) => {
      if (oneProvision?.TEMPLATE?.BODY) {
        oneProvision.TEMPLATE.BODY = JSON.parse(oneProvision.TEMPLATE.BODY)
      }

      return oneProvision
    }

    if (data?.DOCUMENT_POOL?.DOCUMENT) {
      data.DOCUMENT_POOL.DOCUMENT = Array.isArray(data.DOCUMENT_POOL.DOCUMENT)
        ? data.DOCUMENT_POOL.DOCUMENT.map(parseTemplateBody)
        : parseTemplateBody(data.DOCUMENT_POOL.DOCUMENT)
    }
    res.locals.httpCode = httpResponse(response, data)
    next()
  } catch (error) {
    res.locals.httpCode = httpResponse(
      internalServerError,
      '',
      executedCommand.data
    )
    next()
  }
}

/**
 * Delete resource provisions (Async route).
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params of http request
 * @param {number} params.id - resource ID
 * @param {string} params.resource - resource name
 * @param {object} userData - user of http request
 * @param {string} userData.user - username
 * @param {string} userData.password - user password
 */
const deleteResource = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { user, password } = userData
  const { id, resource, provision: provisionId } = params
  if (
    !(
      resource &&
      Number.isInteger(parseInt(id, 10)) &&
      Number.isInteger(parseInt(provisionId, 10)) &&
      user &&
      password
    )
  ) {
    res.locals.httpCode = httpInternalError
    next()

    return
  }

  const endpoint = getEndpoint()
  const authCommand = ['--user', user, '--password', password]
  const paramsCommand = [
    `${resource}`.toLowerCase(),
    'delete',
    `${id}`.toLowerCase(),
    ...optionalParameters,
    ...authCommand,
    ...endpoint,
  ]
  const commandString = `${paramsCommand[0]} ${paramsCommand[1]}`
  let flagSeparateLog = true
  const dataLog = logData(provisionId, true)
  const stream =
    dataLog?.fullPath && createWriteStream(dataLog.fullPath, { flags: 'a' })
  const emit = (lastLine, uuid) => {
    const renderLine = {
      id: provisionId,
      data: lastLine,
      command: commandString,
      commandId: uuid,
    }
    if (flagSeparateLog) {
      renderLine.data = executingMessage(`${messageExecuting} ${commandString}`)
      stream?.write?.(`${JSON.stringify(renderLine)}\n`)
      flagSeparateLog = false
      renderLine.data = lastLine
    }
    stream?.write?.(`${JSON.stringify(renderLine)}\n`)

    return renderLine
  }

  // execute Async Command
  const executedCommand = executeWithEmit(
    paramsCommand,
    {
      close: (success, lastLine) => {
        stream?.end()
      },
      out: emit,
      err: emit,
    },
    { id: provisionId, command: commandString }
  )

  res.locals.httpCode = httpResponse(
    executedCommand ? accepted : internalServerError,
    provisionId
  )
  next()
}

/**
 * Delete provision  (Async route).
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params of http request
 * @param {number} params.id - provision id
 * @param {boolean} params.cleanup - provision cleanup
 * @param {object} userData - user of http request
 * @param {string} userData.user - username
 * @param {string} userData.password - user password
 * @param {Function} oneConnection - function xmlrpc
 */
const deleteProvision = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {},
  oneConnection = defaultEmptyFunction
) => {
  const basePath = `${global.paths.CPI}/provision`
  const relFile = `${basePath}/${relName}`
  const relFileYML = `${relFile}.${ext}`
  const relFileLOCK = `${relFile}.lock`
  const { user, password } = userData
  const { id, cleanup, force } = params
  if (!(Number.isInteger(parseInt(id, 10)) && user && password)) {
    res.locals.httpCode = httpInternalError
    next()

    return
  }

  const command = 'delete'
  const endpoint = getEndpoint()
  const authCommand = ['--user', user, '--password', password]
  const cleanUpTag = cleanup ? ['--cleanup'] : []
  const forceTag = force ? ['--force'] : []
  const paramsCommand = [
    command,
    id,
    ...optionalParameters,
    ...cleanUpTag,
    ...forceTag,
    ...authCommand,
    ...endpoint,
  ]

  const dataLog = logData(params.id, true) // get Log file
  const stream =
    dataLog?.fullPath && createWriteStream(dataLog.fullPath, { flags: 'a' })

  const emit = (lastLine, uuid) => {
    const renderLine = {
      id: params.id,
      data: lastLine,
      command: command,
      commandId: uuid,
    }

    stream?.write?.(`${JSON.stringify(renderLine)}\n`)

    return renderLine
  }

  /**
   * This function is only executed if the command is completed.
   *
   * @param {boolean} success - check in command complete succefully
   * @param {string} lastLine - last line command
   */
  const close = (success, lastLine) => {
    if (success) {
      stream?.end?.()
      existsFile(relFileYML, (filedata) => {
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
                Object.keys(fileData).length !== 0 &&
                  fileData.constructor === Object &&
                  fileData
              ),
              relName
            )
          }
          unlockSync(relFileLOCK)
          if (uuid) {
            // provisions in deploy
            const provisionFolder = findRecursiveFolder(
              `${global.paths.CPI}/provision`,
              uuid
            )
            provisionFolder && removeFile(provisionFolder)
            // provisions in error
            const findFolderERROR = findRecursiveFolder(
              `${global.paths.CPI}/provision`,
              uuid + appendError
            )
            findFolderERROR && removeFile(findFolderERROR)
          }
        }
      })
      const findFolder = findRecursiveFolder(
        `${global.paths.CPI}/provision`,
        params.id
      )
      findFolder && removeFile(findFolder)
    } else {
      const oneConnect = oneConnection(user, password)
      oneConnect({
        action: Actions.DOCUMENT_UPDATE,
        parameters: [
          parseInt(params.id, 10),
          sprintf(defaultErrorTemplate, lastLine),
          1,
        ],
        callback: defaultEmptyFunction,
      })
    }
  }

  // execute Async Command
  const executedCommand = executeWithEmit(
    paramsCommand,
    { close, out: emit, err: emit },
    { id: params.id, command }
  )

  // response Http
  res.locals.httpCode = httpResponse(
    executedCommand ? accepted : internalServerError,
    params.id
  )
  next()
}

/**
 * Execute command of host into provision (Sync route).
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params of http request
 * @param {number} params.id - host provision ID
 * @param {string} params.action - provision accion host
 * @param {object} userData - user of http request
 * @param {string} userData.user - username
 * @param {string} userData.password - user password
 */
const hostCommand = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { user, password } = userData
  const { action, id } = params
  if (!(action && Number.isInteger(parseInt(id, 10)) && user && password)) {
    res.locals.httpCode = httpInternalError
    next()

    return
  }

  const endpoint = getEndpoint()
  const authCommand = ['--user', user, '--password', password]
  const paramsCommand = [
    'host',
    `${action}`.toLowerCase(),
    `${id}`.toLowerCase(),
    ...authCommand,
    ...endpoint,
  ]
  const executedCommand = executeCommand(
    defaultCommandProvision,
    paramsCommand,
    getSpecificConfig('oneprovision_prepend_command')
  )
  try {
    const response = executedCommand.success ? ok : internalServerError
    res.locals.httpCode = httpResponse(
      response,
      executedCommand.data ? JSON.parse(executedCommand.data) : id
    )
    next()
  } catch (error) {
    res.locals.httpCode = httpResponse(
      internalServerError,
      '',
      executedCommand.data
    )
    next()
  }
}

/**
 * Create a provision  (Async route).
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params of http request
 * @param {string} params.resource - resource for provision
 * @param {object} userData - user of http request
 * @param {string} userData.user - username
 * @param {string} userData.password - user password
 * @param {number} userData.id - user id
 */
const createProvision = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const basePath = `${global.paths.CPI}/provision`
  const relFile = `${basePath}/${relName}`
  const relFileYML = `${relFile}.${ext}`
  const relFileLOCK = `${relFile}.lock`
  const { user, password, id } = userData
  const { data } = params
  const optionalCommand = addOptionalCreateCommand()
  const content = createYMLContent(parsePostData(data))

  const responseInternalError = () => {
    res.locals.httpCode = httpInternalError
    next()
  }
  if (!(data && user && password) || !content) {
    responseInternalError()

    return
  }

  const command = 'create'
  const authCommand = ['--user', user, '--password', password]
  const endpoint = getEndpoint()
  const files = createFolderWithFiles(
    `${global.paths.CPI}/provision/${id}/tmp`,
    [
      { name: logFile.name, ext: logFile.ext },
      { name: provisionFile.name, ext: provisionFile.ext, content },
    ]
  )
  if (!(files.name && files.files)) {
    responseInternalError()

    return
  }

  /**
   * Find file in created files.
   *
   * @param {string} val - filename
   * @param {string} extension - file extension
   * @param {Array} arr - array of files
   * @returns {Array} path file
   */
  const find = (val = '', extension = '', arr = files.files) =>
    arr.find(
      (e) =>
        e && e.path && e.ext && e.name && e.name === val && e.ext === extension
    )

  const config = find(provisionFile.name, provisionFile.ext)
  const log = find(logFile.name, logFile.ext)
  if (!(config && log)) {
    responseInternalError()

    return
  }

  /**
   * Create provision.
   *
   * @param {string} filedata - provision data
   */
  const create = (filedata = '') => {
    const paramsCommand = [
      command,
      config.path,
      ...optionalParameters,
      ...optionalCommand,
      ...authCommand,
      ...endpoint,
    ]

    // stream file log
    const stream = createWriteStream(log.path, { flags: 'a' })

    /**
     * This function is performed for each command line response.
     *
     * @param {string} lastLine - last line command
     * @param {string} uuid - UUID command
     * @returns {object} string line of command
     */
    const emit = (lastLine, uuid) => {
      if (lastLine && uuid) {
        if (defaultRegexID.test(lastLine) && !checkSync(relFileLOCK)) {
          const fileData = parse(filedata) || {}
          const parseID = lastLine.match('\\d+')
          const idResource = parseID[0]
          if (idResource && !fileData[idResource]) {
            lockSync(relFileLOCK)
            fileData[idResource] = files.name
            createTemporalFile(
              basePath,
              ext,
              createYMLContent(fileData),
              relName
            )
            unlockSync(relFileLOCK)
          }
        }
        const renderLine = {
          id: files.name,
          data: lastLine,
          command: command,
          commandId: uuid,
        }
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
      if (success && defaultRegexID.test(lastLine)) {
        const newPath = renameFolder(
          config.path,
          lastLine.match('\\d+'),
          'replace'
        )
        if (newPath) {
          existsFile(relFileYML, (file) => {
            if (!checkSync(relFileLOCK)) {
              lockSync(relFileLOCK)
              const fileData = parse(file) || {}
              const findKey = Object.keys(fileData).find(
                (key) => fileData[key] === files.name
              )
              if (findKey) {
                delete fileData[findKey]
                createTemporalFile(
                  basePath,
                  ext,
                  createYMLContent(
                    Object.keys(fileData).length !== 0 &&
                      fileData.constructor === Object &&
                      fileData
                  ),
                  relName
                )
              }
              unlockSync(relFileLOCK)
            }
          })
          moveToFolder(newPath, '/../../../')
        }
      }
      if (success === false) {
        renameFolder(config.path, appendError, 'append')
      }
    }
    executeWithEmit(paramsCommand, { close, out: emit, err: emit }, { command })
  }

  existsFile(
    relFileYML,
    (filedata) => {
      create(filedata)
    },
    () => {
      createFile(relFileYML, '', (filedata) => {
        create(filedata)
      })
    }
  )
  res.locals.httpCode = httpResponse(accepted, files.name)
  next()
}

/**
 * Configure provision (Async route).
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params of http request
 * @param {number} params.id - provision id
 * @param {object} userData - user of http request
 * @param {string} userData.user - username
 * @param {string} userData.password - user password
 */
const configureProvision = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { user, password } = userData
  const { id } = params
  const rtn = httpInternalError

  if (!(Number.isInteger(parseInt(id, 10)) && user && password)) {
    res.locals.httpCode = rtn
    next()

    return
  }

  const command = 'configure'
  const endpoint = getEndpoint()
  const authCommand = ['--user', user, '--password', password]
  const paramsCommand = [
    command,
    id,
    '--fail_cleanup',
    '--force',
    ...optionalParameters,
    ...authCommand,
    ...endpoint,
  ]

  // get Log file
  const dataLog = logData(id, true)

  // create stream for write into file
  const stream =
    dataLog?.fullPath && createWriteStream(dataLog.fullPath, { flags: 'a' })

  const emit = (lastLine, uuid) => {
    const renderLine = {
      id,
      data: lastLine,
      command: command,
      commandId: uuid,
    }
    stream?.write?.(`${JSON.stringify(renderLine)}\n`)

    return renderLine
  }

  /**
   * This function is only executed if the command is completed.
   *
   * @param {boolean} success - check if command complete without errors
   * @param {string} lastLine - last line command
   */
  const close = (success, lastLine) => {
    stream?.end?.()
  }

  // execute Async Command
  const executedCommand = executeWithEmit(
    paramsCommand,
    { close, out: emit, err: emit },
    { id, command }
  )

  // response Http
  res.locals.httpCode = httpResponse(
    executedCommand ? accepted : internalServerError,
    id
  )
  next()
}

/**
 * Configure host provision  (Async route).
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params of http request
 * @param {number} params.id - host id
 * @param {object} userData - user of http request
 * @param {string} userData.user - username
 * @param {string} userData.password - user password
 */
const configureHost = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { user, password } = userData
  const { id } = params
  if (!(Number.isInteger(parseInt(id, 10)) && user && password)) {
    res.locals.httpCode = httpInternalError
    next()

    return
  }

  const command = 'configure'
  const endpoint = getEndpoint()
  const authCommand = ['--user', user, '--password', password]
  const paramsCommand = [
    'host',
    command,
    `${id}`.toLowerCase(),
    '--debug',
    '--fail_cleanup',
    '--batch',
    ...authCommand,
    ...endpoint,
  ]

  // get Log file
  const dataLog = logData(id, true)

  // create stream for write into file
  const stream =
    dataLog?.fullPath && createWriteStream(dataLog.fullPath, { flags: 'a' })

  const emit = (lastLine, uuid) => {
    const renderLine = {
      id,
      data: lastLine,
      command: `host ${command}`,
      commandId: uuid,
    }
    stream && stream.write && stream.write(`${JSON.stringify(renderLine)}\n`)

    return renderLine
  }

  /**
   * This function is only executed if the command is completed.
   *
   * @param {boolean} success - check if command complete without error
   * @param {string} lastLine - last line command
   */
  const close = (success, lastLine) => {
    stream?.end?.()
  }

  // execute Async Command
  const executedCommand = executeWithEmit(
    paramsCommand,
    { close, out: emit, err: emit },
    { id, command: `host ${command}` }
  )

  // response Http
  res.locals.httpCode = httpResponse(
    executedCommand ? accepted : internalServerError,
    id
  )
  next()
}

/**
 * Validate provision file  (Sync route).
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params of http request
 * @param {string} params.resource - resource
 * @param {object} userData - user of http request
 */
const validate = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { user, password } = userData
  const { resource } = params
  const rtn = httpInternalError
  if (!(resource && user && password)) {
    res.locals.httpCode = rtn
    next()

    return
  }

  const endpoint = getEndpoint()
  const authCommand = ['--user', user, '--password', password]
  const schemaValidator = new Validator()
  const parsedResource = parsePostData(resource)
  const valSchema = schemaValidator.validate(parsedResource, provision)
  if (valSchema?.valid) {
    const content = createYMLContent(parsedResource)
    if (content) {
      const file = createTemporalFile(
        `${global.paths.CPI}/${defaultFolderTmpProvision}`,
        'yaml',
        content
      )
      if (file?.name && file?.path) {
        const paramsCommand = [
          'validate',
          '--dump',
          file.path,
          ...authCommand,
          ...endpoint,
        ]
        const executedCommand = executeCommand(
          defaultCommandProvision,
          paramsCommand,
          getSpecificConfig('oneprovision_prepend_command')
        )
        let response = internalServerError
        if (executedCommand && executedCommand.success) {
          response = ok
        }
        removeFile(file)
        res.locals.httpCode = httpResponse(response)
        next()
      }
    }
  } else {
    const errors = []
    if (valSchema?.errors) {
      valSchema.errors.forEach((error) => {
        errors.push(error.stack.replace(/^instance./, ''))
      })
    }
    res.locals.httpCode = httpResponse(
      internalServerError,
      '',
      errors.toString()
    )
    next()
  }
}

/**
 * Get provision log  (Sync route).
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params of http request
 */
const getLogProvisions = (
  res = {},
  next = defaultEmptyFunction,
  params = {}
) => {
  if (!(params && params.id)) {
    res.locals.httpCode = httpInternalError
    next()
  }
  const foundLogs = logData(params.id)
  if (foundLogs) {
    res.locals.httpCode = httpResponse(ok, foundLogs)
  } else {
    res.locals.httpCode = notFound
  }
  next()
}

/**
 * Add Host to provision  (Async route).
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params of http request
 * @param {string} params.resource - resource
 * @param {object} userData - user of http request
 */
const hostAdd = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { user, password } = userData
  const { id, amount } = params
  if (
    !(
      Number.isInteger(parseInt(id, 10)) &&
      Number.isInteger(parseInt(amount, 10)) &&
      user &&
      password
    )
  ) {
    res.locals.httpCode = httpInternalError
    next()

    return
  }

  const endpoint = getEndpoint()
  const authCommand = ['--user', user, '--password', password]
  const paramsCommand = [
    'host',
    'add',
    id,
    '--amount',
    amount,
    ...authCommand,
    ...endpoint,
  ]

  // get Log file
  const dataLog = logData(id, true)

  // create stream for write into file
  const stream =
    dataLog?.fullPath && createWriteStream(dataLog.fullPath, { flags: 'a' })

  /**
   * This function is performed for each command line response.
   *
   * @param {string} lastLine - last line command
   * @param {string} uuid - uuid command
   */
  let flagSeparateLog = true
  const emit = (lastLine, uuid) => {
    const renderLine = {
      id,
      data: lastLine,
      command: 'add host',
      commandId: uuid,
    }
    if (flagSeparateLog) {
      renderLine.data = executingMessage(`${messageExecuting} host add`)
      stream?.write?.(`${JSON.stringify(renderLine)}\n`)
      flagSeparateLog = false
      renderLine.data = lastLine
    }
    stream?.write?.(`${JSON.stringify(renderLine)}\n`)

    return renderLine
  }

  // execute Async Command
  const executedCommand = executeWithEmit(
    paramsCommand,
    {
      close: (success, lastLine) => {
        stream && stream.end && stream.end()
      },
      out: emit,
      err: emit,
    },
    { id, command: 'add host' }
  )

  // response Http
  res.locals.httpCode = httpResponse(
    executedCommand ? accepted : internalServerError,
    id
  )
  next()
}

/**
 * Add Ips to provision (Sync route).
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params of http request
 * @param {string} params.resource - resource
 * @param {object} userData - user of http request
 */
const ipAdd = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { id, amount } = params
  const { user, password } = userData
  if (
    !(
      Number.isInteger(parseInt(id, 10)) &&
      Number.isInteger(parseInt(amount, 10)) &&
      user &&
      password
    )
  ) {
    res.locals.httpCode = httpInternalError
    next()

    return
  }
  const authCommand = ['--user', user, '--password', password]
  const endpoint = getEndpoint()

  res.locals.httpCode =
    addResourceSync([
      'ip',
      'add',
      id,
      '--amount',
      amount,
      ...authCommand,
      ...endpoint,
    ]) || httpInternalError
  next()
}

module.exports = {
  getProvisionDefaults,
  getLogProvisions,
  getListResourceProvision,
  getListProvisions,
  deleteResource,
  deleteProvision,
  hostCommand,
  createProvision,
  configureProvision,
  configureHost,
  validate,
  hostAdd,
  ipAdd,
}
