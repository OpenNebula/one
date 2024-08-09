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
const dns = require('dns')
const https = require('https')
const http = require('http')
const { env } = require('process')
const { Map } = require('immutable')
const { global } = require('window-or-global')
const { resolve } = require('path')
const {
  createCipheriv,
  // eslint-disable-next-line node/no-deprecated-api
  createCipher,
  createDecipheriv,
  // eslint-disable-next-line node/no-deprecated-api
  createDecipher,
  createHash,
} = require('crypto')
const {
  existsSync,
  readFileSync,
  createWriteStream,
  readdirSync,
  statSync,
  removeSync,
  moveSync,
  ensureFileSync,
} = require('fs-extra')
const { spawnSync, spawn } = require('child_process')
const events = require('events')
const { DateTime } = require('luxon')
const { request: axios } = require('axios')
const { defaults, httpCodes } = require('server/utils/constants')
const { messageTerminal } = require('server/utils/general')
const { validateAuth } = require('server/utils/jwt')
const { writeInLogger } = require('server/utils/logger')

const eventsEmitter = new events.EventEmitter()
const {
  httpMethod,
  defaultApps,
  defaultAppName,
  defaultConfigFile,
  defaultLogFilename,
  defaultLogPath,
  defaultSharePath,
  defaultSystemPath,
  defaultSourceSystemPath,
  defaultVmrcTokens,
  defaultVarPath,
  defaultKeyFilename,
  defaultSunstoneAuth,
  defaultWebpackMode,
  defaultEtcPath,
  defaultTypeCrypto,
  defaultHash,
  defaultSunstonePath,
  defaultSunstoneViews,
  defaultSunstoneConfig,
  defaultProvisionPath,
  defaultProvisionConfig,
  defaultDownloader,
  defaultEmptyFunction,
} = defaults

const { internalServerError } = httpCodes
const { POST } = httpMethod

let cert = ''
let key = ''

/**
 * Sets the default DNS lookup order to prefer IPv4 addresses first
 * if the Node.js version is 16.0.0 or higher.
 *
 * @returns {void}
 */
const setDnsResultOrder = () => {
  const [major] = process.versions.node.split('.').map(Number)
  if (major >= 16) {
    dns.setDefaultResultOrder('ipv4first')
  }
}

setDnsResultOrder()

/**
 * Validate if server app have certs.
 *
 * @returns {boolean} file certs
 */
const validateServerIsSecure = () => {
  const folder = 'cert/'
  const dirCerts =
    env && env.NODE_ENV === defaultWebpackMode
      ? ['../', '../', '../', folder]
      : ['../', folder]
  const pathfile = resolve(__dirname, ...dirCerts)
  cert = `${pathfile}/cert.pem`
  key = `${pathfile}/key.pem`

  return existsSync && key && cert && existsSync(key) && existsSync(cert)
}
/**
 * Get certificate SSL.
 *
 * @returns {string} ssl path
 */
const getCert = () => cert

/**
 * Get key of certificate SSL.
 *
 * @returns {string} key ssl path
 */
const getKey = () => key

/**
 * Validate the route http method.
 *
 * @param {string} resourceHttpMethod - http method
 * @returns {string|false} validate the http method of function route
 */
const validateHttpMethod = (resourceHttpMethod = '') =>
  resourceHttpMethod && Object.keys(httpMethod).includes(resourceHttpMethod)
    ? resourceHttpMethod.toLocaleLowerCase()
    : false

/**
 * Response http.
 *
 * @param {object} response - response http
 * @param {string} data - data for response http
 * @param {string} message - message
 * @param {string} file - file
 * @returns {object} {data, message, id}
 */
const httpResponse = (response = null, data = '', message = '', file = '') => {
  let rtn = Map(internalServerError).toObject()
  rtn.data = data
  if (response) {
    rtn = Map(response).toObject()
  }
  if (data || data === 0) {
    rtn.data = data
  }
  if (message) {
    rtn.message = message
  }
  if (file) {
    rtn.message && delete rtn.message
    rtn.data && delete rtn.data
    rtn.file = file
  }

  return rtn
}

/**
 * Get Query data for websockets.
 *
 * @param {object} server - express app
 * @returns {object} queries http
 */
const getQueryData = (server = {}) => {
  let rtn = {}
  if (server && server.handshake && server.handshake.query) {
    rtn = server.handshake.query
  }

  return rtn
}

/**
 * Validate Authentication for websocket.
 *
 * @param {object} server - express app
 * @returns {undefined|boolean} if token is valid
 */
const validateAuthWebsocket = (server = {}) => {
  const { token } = getQueryData(server)
  if (token) {
    return validateAuth({
      headers: { authorization: token },
    })
  }
}

/**
 * Get resource data for http request.
 *
 * @param {object} server - express app
 * @returns {object} request data
 */
const getResourceDataForRequest = (server = {}) => {
  const { id, resource } = getQueryData(server)
  const { aud: username } = validateAuthWebsocket(server)

  return { id, resource, username }
}

/**
 * MIDDLEWARE Websockets, validates if the user has permissions for the resource hook.
 *
 * @param {object} server - express app
 * @param {Function} next - express stepper
 */
const middlewareValidateResourceForHookConnection = (
  server = {},
  next = () => undefined
) => {
  const { id, resource, username } = getResourceDataForRequest(server)

  if (
    id &&
    resource &&
    username &&
    global &&
    global.users &&
    global.users[username] &&
    global.users[username].resourcesHooks &&
    global.users[username].resourcesHooks[resource.toLowerCase()] >= 0 &&
    global.users[username].resourcesHooks[resource.toLowerCase()] ===
      parseInt(id, 10)
  ) {
    next()
  } else {
    server.disconnect(true)
  }
}

/**
 * MIDDLEWARE Websockets, authenticate user.
 *
 * @param {object} server - express app
 * @param {Function} next - express stepper
 */
const middlewareValidateAuthWebsocket = (
  server = {},
  next = () => undefined
) => {
  if (validateAuthWebsocket(server)) {
    next()
  } else {
    server.disconnect(true)
  }
}

/**
 * Encrypt.
 *
 * @param {string} data - data to encrypt
 * @param {string} encryptKey - key to encrypt data
 * @param {string} iv - initialization vector to encrypt data
 * @returns {string} data encrypt
 */
const encrypt = (data = '', encryptKey = '', iv = '') => {
  let rtn
  if (data && encryptKey && iv) {
    try {
      const cipher = iv
        ? createCipheriv(defaultTypeCrypto, encryptKey, iv)
        : createCipher(defaultTypeCrypto, encryptKey)
      let encryptData = cipher.update(data, 'ascii', 'base64')
      encryptData += cipher.final('base64')
      rtn = encryptData
    } catch (err) {
      const errorData = (err && err.message) || ''
      writeInLogger(errorData)
      messageTerminal({
        color: 'red',
        message: 'Error: %s',
        error: errorData,
      })
    }
  }

  return rtn
}

/**
 * Decrypt.
 *
 * @param {string} data - data to decrypt
 * @param {string} decryptKey - key to decrypt data
 * @param {string} iv - initialization vector to decrypt data
 * @returns {string} data decrypt
 */
const decrypt = (data = '', decryptKey = '', iv = '') => {
  let rtn
  if (data && decryptKey && iv) {
    try {
      const cipher = iv
        ? createDecipheriv(defaultTypeCrypto, decryptKey, iv)
        : createDecipher(defaultTypeCrypto, decryptKey)
      let decryptData = cipher.update(data, 'base64', 'ascii')
      decryptData += cipher.final('ascii')
      rtn = decryptData
    } catch (err) {
      const errorData = (err && err.message) || ''
      writeInLogger(errorData)
      messageTerminal({
        color: 'red',
        message: 'Error: %s',
        error: errorData,
      })
    }
  }

  return rtn
}

const getSize = (limit) => {
  const size = limit?.toLowerCase?.()?.match(/^((?:0\.)?\d+)([kmg])$/)
  const limitNumber = parseInt(limit, 10)
  if (size) {
    switch (size[2]) {
      case 'k':
        return size[1] * 1024
      case 'm':
        return size[1] * 1024 ** 2
      case 'g':
        return size[1] * 1024 ** 3
    }
  } else if (Number.isInteger(limitNumber)) {
    return limitNumber
  }
}

/**
 * Rotate file by size.
 *
 *
 * @param {string} filepath - file path
 * @param {number} limit - size to rotate
 */
const rotateBySize = (filepath = '', limit) => {
  try {
    const fileStats = statSync(filepath)
    if (fileStats.size >= getSize(limit)) {
      moveSync(filepath, `${filepath}.${DateTime.now().toSeconds()}`)
      ensureFileSync(filepath)
    }
  } catch (error) {
    const errorData = (error && error.message) || ''
    writeInLogger(errorData)
    messageTerminal({
      color: 'red',
      message: 'Error: %s',
      error: errorData,
    })
  }
}

/**
 * Check if file exist.
 *
 * @param {string} path - path of file
 * @param {Function} success - function executed when file exist
 * @param {Function} error - function executed when file no exists
 * @param {boolean} notify - dissable the error CLI output
 * @returns {boolean} validate if file exists
 */
const existsFile = (
  path = '',
  success = defaultEmptyFunction,
  error = defaultEmptyFunction,
  notify = true
) => {
  let rtn = false
  let file
  let errorData
  try {
    const fileData = readFileSync(path, 'utf8')
    if (path) {
      file = fileData || ''
      rtn = true
    }
  } catch (err) {
    errorData = (err && err.message) || ''
    writeInLogger(errorData)
    notify &&
      messageTerminal({
        color: 'red',
        message: 'Error: %s',
        error: errorData,
      })
  }
  if (rtn) {
    success(file, path)
  } else {
    error(errorData)
  }

  return rtn
}

/**
 * Create a file.
 *
 * @param {string} path - path of file
 * @param {string} data - content of file
 * @param {Function} callback - run function when file is created
 * @param {Function} error - run function when file creation failed
 * @returns {boolean} check if file is created
 */
const createFile = (
  path = '',
  data = '',
  callback = () => undefined,
  error = () => undefined
) => {
  let rtn = false
  try {
    const stream = createWriteStream(path)
    stream.write(data)
    callback(data, stream)
    rtn = true
  } catch (err) {
    error(err)
  }

  return rtn
}

/**
 * Generate fireedge key file.
 */
const genFireedgeKey = () => {
  if (global && global.paths && !global.paths.FIREEDGE_KEY) {
    const { v4 } = require('uuid')
    let uuidv4 = v4()
    if (global.paths.FIREEDGE_KEY_PATH && uuidv4) {
      uuidv4 = uuidv4.replace(/-/g, '').toUpperCase()
      existsFile(
        global.paths.FIREEDGE_KEY_PATH,
        (filedata) => {
          if (filedata) {
            uuidv4 = filedata
          }
        },
        () => {
          createFile(
            global.paths.FIREEDGE_KEY_PATH,
            uuidv4.replace(/-/g, ''),
            () => {
              const formatError = 'file %s created'
              writeInLogger(global.paths.FIREEDGE_KEY_PATH, {
                format: formatError,
                level: 2,
              })
              messageTerminal({
                color: 'green',
                message: formatError,
                error: global.paths.FIREEDGE_KEY_PATH,
              })
            },
            (err) => {
              const errorData = (err && err.message) || ''
              writeInLogger(errorData)
              messageTerminal({
                color: 'red',
                message: 'Error: %s',
                error: errorData,
              })
            }
          )
        },
        false
      )
    }
    global.paths.FIREEDGE_KEY = uuidv4
  }
}

/**
 * Replace escape sequence.
 *
 * @param {string} text - string to clean
 * @returns {string} clean string
 */
const replaceEscapeSequence = (text = '') => {
  let rtn = text
  if (text) {
    rtn = text.replace(/\r|\n/g, '')
  }

  return rtn
}

/**
 * Get sunstone auth.
 *
 * @returns {object} credentials of serveradmin
 */
const getSunstoneAuth = () => {
  let rtn
  if (global?.paths?.SUNSTONE_AUTH_PATH) {
    existsFile(
      global.paths.SUNSTONE_AUTH_PATH,
      (filedata) => {
        if (filedata) {
          const serverAdminData = filedata.split(':')
          if (serverAdminData[0] && serverAdminData[1]) {
            const { hash, digest } = defaultHash
            const username = replaceEscapeSequence(serverAdminData[0])
            const password = createHash(hash)
              .update(replaceEscapeSequence(serverAdminData[1]))
              .digest(digest)
            const genKey = password.substring(0, 32)
            const iv = genKey.substring(0, 16)
            rtn = { username, key: genKey, iv }
          }
        }
      },
      (err) => {
        const errorData = err.message || ''
        const config = {
          color: 'red',
          message: 'Error: %s',
          error: errorData,
        }
        writeInLogger(errorData)
        messageTerminal(config)
      }
    )
  }

  return rtn
}

/**
 * Get data of zone.
 *
 * @param {string} zone - zone id
 * @param {string} configuredZones - default zones
 * @returns {object} data zone
 */
const getDataZone = (zone = '0', configuredZones) => {
  let rtn
  const zones = global?.zones || configuredZones
  if (Array.isArray(zones)) {
    rtn = zones[0]
    if (Number.isInteger(parseInt(zone, 10))) {
      rtn = zones.find((zn) => zn?.id && String(zn.id) === String(zone))
    }
  }

  return rtn
}

/**
 * Generate a resource paths.
 */
const genPathResources = () => {
  const devMode = env && env.NODE_ENV && env.NODE_ENV === defaultWebpackMode

  const ONE_LOCATION = env && env.ONE_LOCATION
  const LOG_LOCATION = !ONE_LOCATION ? defaultLogPath : `${ONE_LOCATION}/var`
  const SHARE_LOCATION = !ONE_LOCATION
    ? defaultSharePath
    : `${ONE_LOCATION}/share`
  const SYSTEM_LOCATION =
    (devMode && resolve(__dirname, '../../client')) ||
    (!ONE_LOCATION
      ? resolve(defaultSystemPath)
      : resolve(`${ONE_LOCATION}${defaultSourceSystemPath}`))
  const VAR_LOCATION = !ONE_LOCATION ? defaultVarPath : `${ONE_LOCATION}/var`
  const ETC_LOCATION = !ONE_LOCATION ? defaultEtcPath : `${ONE_LOCATION}/etc`
  const VMRC_LOCATION = !ONE_LOCATION ? defaultVarPath : ONE_LOCATION

  if (global) {
    if (!global.paths) {
      global.paths = {}
    }
    if (!global.paths.FIREEDGE_CONFIG) {
      global.paths.FIREEDGE_CONFIG = `${ETC_LOCATION}/${defaultConfigFile}`
    }
    if (!global.paths.VMRC_TOKENS) {
      global.paths.VMRC_TOKENS = `${VMRC_LOCATION}/${defaultVmrcTokens}`
    }
    if (!global.paths.FIREEDGE_LOG) {
      global.paths.FIREEDGE_LOG = `${LOG_LOCATION}/${defaultLogFilename}`
    }
    if (!global.paths.FIREEDGE_LOG_LEVEL) {
      global.paths.FIREEDGE_LOG = `${LOG_LOCATION}/${defaultLogFilename}`
    }
    if (!global.paths.DOWNLOADER) {
      global.paths.DOWNLOADER = `${VAR_LOCATION}/${defaultDownloader}`
    }
    if (!global.paths.SUNSTONE_AUTH_PATH) {
      global.paths.SUNSTONE_AUTH_PATH = `${VAR_LOCATION}/.one/${defaultSunstoneAuth}`
    }
    if (!global.paths.SUNSTONE_PATH) {
      global.paths.SUNSTONE_PATH = `${ETC_LOCATION}/${defaultSunstonePath}/`
    }
    if (!global.paths.SUNSTONE_CONFIG) {
      global.paths.SUNSTONE_CONFIG = `${ETC_LOCATION}/${defaultSunstonePath}/${defaultSunstoneConfig}`
    }
    if (!global.paths.SUNSTONE_IMAGES) {
      global.paths.SUNSTONE_IMAGES = `${SYSTEM_LOCATION}/assets/images/logos`
    }
    if (!global.paths.SUNSTONE_VIEWS) {
      global.paths.SUNSTONE_VIEWS = `${ETC_LOCATION}/${defaultSunstonePath}/${defaultSunstoneViews}`
    }
    if (!global.paths.VMM_EXEC_CONFIG) {
      global.paths.VMM_EXEC_CONFIG = `${ETC_LOCATION}/vmm_exec`
    }
    if (!global.paths.FIREEDGE_KEY_PATH) {
      global.paths.FIREEDGE_KEY_PATH = `${VAR_LOCATION}/.one/${defaultKeyFilename}`
    }
    if (!global.paths.CPI) {
      global.paths.CPI = `${VAR_LOCATION}/${defaultAppName}`
    }
    if (!global.paths.PROVISION_PATH) {
      global.paths.PROVISION_PATH = `${ETC_LOCATION}/${defaultProvisionPath}/`
    }
    if (!global.paths.PROVISION_CONFIG) {
      global.paths.PROVISION_CONFIG = `${ETC_LOCATION}/${defaultProvisionPath}/${defaultProvisionConfig}`
    }
    if (!global.paths.ETC_CPI) {
      global.paths.ETC_CPI = `${ETC_LOCATION}/${defaultAppName}`
    }
    if (!global.paths.SHARE_CPI) {
      global.paths.SHARE_CPI = `${SHARE_LOCATION}/oneprovision/edge-clusters`
    }
  }
}

/**
 * Get files into params.
 *
 * @param {object} params - finder params
 * @returns {Array} - params file
 */
const getRequestFiles = (params = {}) => {
  if (
    params &&
    Object.keys(params).length > 0 &&
    params.constructor === Object
  ) {
    const arrayParams = Object.keys(params)
    const fileParams = arrayParams.filter(
      (keyFiles = '') =>
        keyFiles && params[keyFiles] && params[keyFiles].from === 'files'
    )

    return fileParams
  }
}

/**
 * Get http params.
 *
 * @param {object} params - finder params
 * @param {object} req - http request
 * @returns {object} params by functions
 */
const getRequestParameters = (params = {}, req = {}) => {
  const rtn = {}
  if (
    params &&
    Object.keys(params).length > 0 &&
    params.constructor === Object
  ) {
    Object.entries(params).forEach(([param, value]) => {
      if (param && value && value.from && req[value.from]) {
        rtn[param] = value.all ? req[value.from] : req[value.from][param]
      }
    })
  }

  return rtn
}

/**
 * Error format template (console.log).
 *
 * @param {string} err - error message
 * @param {string} message - format
 * @returns {object} {color, message, error} format for the messageTerminal function
 */
const defaultError = (err = '', message = 'Error: %s') => ({
  color: 'red',
  message,
  error: err || '',
})

/**
 * Get files by path.
 *
 * @param {string} path - path of files
 * @param {boolean} recursive - find all files into path
 * @param {Array} files - for recursion
 * @returns {Array} files
 */
const getFiles = (path = '', recursive = false, files = []) => {
  if (path) {
    try {
      const dirs = readdirSync(path)
      dirs.forEach((dir) => {
        const name = `${path}/${dir}`
        if (recursive && statSync(name).isDirectory()) {
          const internal = getFiles(name, recursive)
          if (internal) {
            files.push(...internal)
          }
        }

        if (statSync(name).isFile()) {
          files.push(name)
        }
      })
    } catch (error) {
      const errorData = (error && error.message) || ''
      writeInLogger(errorData)
      messageTerminal(defaultError(errorData))
    }
  }

  return files
}

/**
 * Get files by ext.
 *
 * @param {string} dir - path
 * @param {string} ext - ext
 * @param {Function} errorCallback - run this function if it cant read directory
 * @returns {Array} array of pathfiles
 */
const getFilesbyEXT = (
  dir = '',
  ext = '',
  errorCallback = defaultEmptyFunction
) => {
  const pathFiles = []
  if (dir && ext) {
    const exp = new RegExp('\\w*\\.' + ext + '+$\\b', 'gi')
    try {
      const files = readdirSync(dir)
      files.forEach((file) => {
        const name = `${dir}/${file}`
        if (statSync(name).isDirectory()) {
          getFiles(name)
        } else {
          if (name.match(exp)) {
            pathFiles.push(name)
          }
        }
      })
    } catch (error) {
      const errorMsg = (error && error.message) || ''
      writeInLogger(errorMsg)
      messageTerminal(defaultError(errorMsg))
      errorCallback(errorMsg)
    }
  }

  return pathFiles
}

/**
 * Get directories for path.
 *
 * @param {string} dir - path
 * @param {Function} errorCallback - run this function if it cant read directory
 * @returns {Array} directories
 */
const getDirectories = (dir = '', errorCallback = () => undefined) => {
  const directories = []
  if (dir) {
    try {
      const files = readdirSync(dir)
      files.forEach((file) => {
        const name = `${dir}/${file}`
        if (statSync(name).isDirectory()) {
          directories.push({ filename: file, path: name })
        }
      })
    } catch (error) {
      const errorMsg = (error && error.message) || ''
      writeInLogger(errorMsg)
      messageTerminal(defaultError(errorMsg))
      errorCallback(errorMsg)
    }
  }

  return directories
}

/**
 * Parse post data.
 *
 * @param {object} postData - port data
 * @returns {object} data parsed
 */
const parsePostData = (postData = {}) => {
  const rtn = {}
  Object.entries(postData).forEach(([postKey, value]) => {
    try {
      rtn[postKey] = JSON.parse(value, (k, val) => {
        try {
          return JSON.parse(val)
        } catch (error) {
          return val
        }
      })
    } catch (error) {
      rtn[postKey] = value
    }
  })

  return rtn
}

/**
 * Add prepend of command example: 'ssh xxxx:'".
 *
 * @param {string} command - cli command
 * @param {string} resource - resource by command
 * @param {string} prepend - prepend for command
 * @returns {object} command and resource
 */
const addPrependCommand = (command = '', resource = '', prepend = '') => {
  const rsc = Array.isArray(resource) ? resource : [resource]
  let newCommand = command
  let newRsc = rsc

  if (prepend) {
    const splitPrepend = prepend.split(' ').filter((el) => el !== '')
    newCommand = splitPrepend[0]
    // remove command
    splitPrepend.shift()

    // stringify the rest of the parameters
    const stringifyRestCommand = [command, ...rsc].join(' ')

    newRsc = [...splitPrepend, stringifyRestCommand]
  }

  return {
    cmd: newCommand,
    rsc: newRsc,
  }
}

/**
 * Run Synchronous commands for CLI.
 *
 * @param {string} command - command to execute
 * @param {string} resource - params for the command to execute
 * @param {string} prependCommand - prepend for command
 * @param {object} options - optional params for the command
 * @returns {object} CLI output
 */
const executeCommand = (
  command = '',
  resource = '',
  prependCommand = '',
  options = {}
) => {
  let rtn = { success: false, data: null }
  const { cmd, rsc } = addPrependCommand(command, resource, prependCommand)
  const execute = spawnSync(cmd, rsc, options)

  if (execute) {
    if (execute.stdout && execute.status === 0) {
      rtn = { success: true, data: execute.stdout.toString() }
    } else if (execute.stderr && execute.stderr.length > 0) {
      rtn = { success: false, data: execute.stderr.toString() }
      messageTerminal(
        defaultError(execute.stderr.toString(), 'Error command: %s')
      )
    }
  }

  return rtn
}
/**
 * Check app name.
 *
 * @param {string} appName - app name
 * @returns {object} app
 */
const checkValidApp = (appName = '') => defaultApps[appName]

/**
 * Delete file.
 *
 * @param {string} path - the path for delete
 * @returns {boolean} flag if file is deleted
 */
const removeFile = (path = '') => {
  let rtn = false
  if (path) {
    try {
      removeSync(path, { force: true })
      rtn = true
    } catch (error) {
      messageTerminal(defaultError(error && error.message))
    }
  }

  return rtn
}

/**
 * Run Asynchronous commands for CLI.
 *
 * @param {string} command - command to execute
 * @param {string} resource - params for the command to execute
 * @param {string} prependCommand - prepend for command
 * @param {object} callbacks - the functions in case the command emits by the stderr(err), stdout(out) and when it finishes(close)
 */
const executeCommandAsync = (
  command = '',
  resource = '',
  prependCommand = '',
  callbacks = {
    err: defaultEmptyFunction,
    out: defaultEmptyFunction,
    close: defaultEmptyFunction,
  }
) => {
  const err =
    callbacks && callbacks.err && typeof callbacks.err === 'function'
      ? callbacks.err
      : defaultEmptyFunction
  const out =
    callbacks && callbacks.out && typeof callbacks.out === 'function'
      ? callbacks.out
      : defaultEmptyFunction
  const close =
    callbacks && callbacks.close && typeof callbacks.close === 'function'
      ? callbacks.close
      : defaultEmptyFunction

  const { cmd, rsc } = addPrependCommand(command, resource, prependCommand)

  const execute = spawn(cmd, rsc)
  if (execute) {
    execute.stderr.on('data', (data) => {
      err(data)
    })

    execute.stdout.on('data', (data) => {
      out(data)
    })

    execute.on('error', (error) => {
      messageTerminal(defaultError(error && error.message, 'Error command: %s'))
    })

    execute.on('close', (code) => {
      if (close) {
        // code === 0 is success command
        close(code === 0)
      }
    })
  }
}

/**
 * Create a event emiter.
 *
 * @param {string} eventName - name event
 * @param {object} message - object message
 */
const publish = (eventName = '', message = {}) => {
  if (eventName && message) {
    eventsEmitter.emit(eventName, message)
  }
}

/**
 * Subscriber to event emitter.
 *
 * @param {string} eventName - event name
 * @param {Function} callback - function executed when event is emited
 */
const subscriber = (eventName = '', callback = () => undefined) => {
  if (
    eventName &&
    callback &&
    typeof callback === 'function' &&
    eventsEmitter.listenerCount(eventName) < 1
  ) {
    eventsEmitter.on(eventName, (message) => {
      callback(message)
    })
  }
}

/**
 * Axios request.
 *
 * @param {object} data - data for request
 * @param {object} data.params - params for request
 * @param {string} data.method - request method
 * @param {string} data.agent - request agent
 * @param {object} callbacks - callbacks
 * @param {Function} callbacks.success - success callback
 * @param {Function} callbacks.error - error callback
 */
const executeRequest = (data = {}, callbacks = {}) => {
  const { params = {}, method = POST, agent } = data
  const { success = defaultEmptyFunction, error = defaultEmptyFunction } =
    callbacks
  const defaultsProperties = agent
    ? {
        method,
        httpsAgent:
          agent === 'https'
            ? new https.Agent({ rejectUnauthorized: false })
            : new http.Agent({ rejectUnauthorized: false }),
        validateStatus: (status) => status >= 200 && status < 400,
      }
    : {}

  axios({ ...defaultsProperties, ...params })
    .then(({ data: dataRequest } = {}) => success(dataRequest))
    .catch(error)
}

module.exports = {
  encrypt,
  decrypt,
  getDataZone,
  existsFile,
  getSunstoneAuth,
  replaceEscapeSequence,
  createFile,
  httpResponse,
  validateServerIsSecure,
  genPathResources,
  genFireedgeKey,
  getCert,
  getKey,
  parsePostData,
  getRequestFiles,
  getRequestParameters,
  getQueryData,
  getResourceDataForRequest,
  middlewareValidateAuthWebsocket,
  middlewareValidateResourceForHookConnection,
  defaultError,
  getDirectories,
  getFiles,
  getFilesbyEXT,
  executeCommand,
  executeCommandAsync,
  checkValidApp,
  removeFile,
  validateHttpMethod,
  publish,
  subscriber,
  executeRequest,
  rotateBySize,
  setDnsResultOrder,
}
