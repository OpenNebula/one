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
const { env } = require('process')
const { Map } = require('immutable')
const { global } = require('window-or-global')
const { dirname } = require('path')
// eslint-disable-next-line node/no-deprecated-api
const { createCipheriv, createCipher, createDecipheriv, createDecipher, createHash } = require('crypto')
const { existsSync, readFileSync, createWriteStream, readdirSync, statSync } = require('fs-extra')
const { internalServerError } = require('./constants/http-codes')
const { messageTerminal } = require('server/utils/general')
const { validateAuth } = require('server/utils/jwt')
const {
  from: fromData,
  defaultAppName,
  defaultConfigFile,
  defaultLogFilename,
  defaultLogPath,
  defaultSharePath,
  defaultVmrcTokens,
  defaultVarPath,
  defaultKeyFilename,
  defaultSunstoneAuth,
  defaultWebpackMode,
  defaultOpennebulaZones,
  defaultEtcPath,
  defaultTypeCrypto,
  defaultHash,
  defaultSunstonePath,
  defaultSunstoneViews,
  defaultSunstoneConfig,
  defaultEmptyFunction
} = require('./constants/defaults')

let cert = ''
let key = ''

const fillFunctionRoute = (method, endpoint, action) => ({
  httpMethod: method,
  endpoint,
  action
})

const addFunctionToRoute = (req = {}, res = {}, next = defaultEmptyFunction, routes = {}, user = {}, oneConnection = defaultEmptyFunction, index = 0) => {
  const resources = Object.keys(req[fromData.resource])
  if (req && res && next && routes) {
    const route = routes[`${req[fromData.resource][resources[index]]}`.toLowerCase()]
    if (req && fromData && fromData.resource && req[fromData.resource] && route) {
      if (Object.keys(route).length > 0 && route.constructor === Object) {
        if (route.action && route.params && typeof route.action === 'function') {
          const params = getParamsForObject(route.params, req)
          route.action(res, next, params, user, oneConnection)
        } else {
          addFunctionToRoute(req, res, next, route, user, oneConnection, index + 1)
        }
      } else {
        next()
      }
    } else {
      next()
    }
  } else {
    next()
  }
}

const validateServerIsSecure = () => {
  const folder = '../cert/'
  const pathfile = env && env.NODE_ENV === defaultWebpackMode ? `${__dirname}/../../${folder}` : `${__dirname}/${folder}`
  cert = `${pathfile}cert.pem`
  key = `${pathfile}key.pem`
  return existsSync && key && cert && existsSync(key) && existsSync(cert)
}

const getCert = () => cert
const getKey = () => key

const httpResponse = (response, data, message) => {
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
  return rtn
}
const returnQueryData = (server = {}) => {
  let rtn = {}
  if (
    server &&
    server.handshake &&
    server.handshake.query
  ) {
    rtn = server.handshake.query
  }
  return rtn
}

const validateAuthWebsocket = (server = {}) => {
  let rtn
  const { token } = returnQueryData(server)
  if (token) {
    rtn = validateAuth({
      headers: { authorization: token }
    })
  }
  return rtn
}

const getResourceForHookConnection = (server = {}) => {
  const { id, resource } = returnQueryData(server)
  const { aud: username } = validateAuthWebsocket(server)
  return { id, resource, username }
}

const middlewareValidateResourceForHookConnection = (server = {}, next = () => undefined) => {
  const { id, resource, username } = getResourceForHookConnection(server)
  if (
    id &&
    resource &&
    username &&
    global &&
    global.users &&
    global.users[username] &&
    global.users[username].resourcesHooks &&
    global.users[username].resourcesHooks[resource.toLowerCase()] >= 0 &&
    global.users[username].resourcesHooks[resource.toLowerCase()] === parseInt(id, 10)
  ) {
    next()
  } else {
    server.disconnect(true)
  }
}

const middlewareValidateAuthWebsocket = (server = {}, next = () => undefined) => {
  if (validateAuthWebsocket(server)) {
    next()
  } else {
    server.disconnect(true)
  }
}

const encrypt = (data = '', key = '', iv = '') => {
  let rtn
  if (data && key) {
    try {
      const cipher = iv ? createCipheriv(defaultTypeCrypto, key, iv) : createCipher(defaultTypeCrypto, key)
      let encryptData = cipher.update(data, 'ascii', 'base64')
      encryptData += cipher.final('base64')
      rtn = encryptData
    } catch (err) {
      const errorData = (err && err.message) || ''
      messageTerminal({
        color: 'red',
        message: 'Error: %s',
        error: errorData
      })
    }
  }
  return rtn
}

const decrypt = (data = '', key = '', iv = '') => {
  let rtn
  if (data && key) {
    try {
      const cipher = iv ? createDecipheriv(defaultTypeCrypto, key, iv) : createDecipher(defaultTypeCrypto, key)
      let decryptData = cipher.update(data, 'base64', 'ascii')
      decryptData += cipher.final('ascii')
      rtn = decryptData
    } catch (err) {
      const errorData = (err && err.message) || ''
      messageTerminal({
        color: 'red',
        message: 'Error: %s',
        error: errorData
      })
    }
  }
  return rtn
}

const existsFile = (path = '', success = () => undefined, error = () => undefined) => {
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
    messageTerminal({
      color: 'red',
      message: 'Error: %s',
      error: errorData
    })
  }
  if (rtn) {
    success(file, path)
  } else {
    error(errorData)
  }
  return rtn
}

const createFile = (path = '', data = '', callback = () => undefined, error = () => undefined) => {
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

const genFireedgeKey = () => {
  if (global && !global.FIREEDGE_KEY) {
    const { v4 } = require('uuid')
    let uuidv4 = v4()
    if (global.FIREEDGE_KEY_PATH && uuidv4) {
      uuidv4 = uuidv4.replace(/-/g, '').toUpperCase()
      existsFile(
        global.FIREEDGE_KEY_PATH,
        filedata => {
          if (filedata) {
            uuidv4 = filedata
          }
        },
        () => {
          createFile(
            global.FIREEDGE_KEY_PATH, uuidv4.replace(/-/g, ''), () => undefined, err => {
              messageTerminal({
                color: 'red',
                message: 'Error: %s',
                error: (err && err.message) || ''
              })
            })
        }
      )
    }
    global.FIREEDGE_KEY = uuidv4
  }
}

const replaceEscapeSequence = (text = '') => {
  let rtn = text
  if (text) {
    rtn = text.replace(/\r|\n/g, '')
  }
  return rtn
}

const getSunstoneAuth = () => {
  let rtn
  if (global && global.SUNSTONE_AUTH_PATH) {
    existsFile(global.SUNSTONE_AUTH_PATH,
      filedata => {
        if (filedata) {
          const serverAdminData = filedata.split(':')
          if (serverAdminData[0] && serverAdminData[1]) {
            const { hash, digest } = defaultHash
            const username = replaceEscapeSequence(serverAdminData[0])
            const password = createHash(hash).update(replaceEscapeSequence(serverAdminData[1])).digest(digest)
            const key = password.substring(0, 32)
            const iv = key.substring(0, 16)
            rtn = { username, key, iv }
          }
        }
      }, err => {
        const config = {
          color: 'red',
          message: 'Error: %s',
          error: err.message || ''
        }
        messageTerminal(config)
      })
  }
  return rtn
}

const getDataZone = (zone = '0', configuredZones) => {
  let rtn
  const zones = (global && global.zones) || configuredZones || defaultOpennebulaZones
  if (zones && Array.isArray(zones)) {
    rtn = zones[0]
    if (zone !== null) {
      rtn = zones.find(
        zn => zn && zn.id !== undefined && String(zn.id) === zone
      )
    }
  }
  return rtn
}

const genPathResources = () => {
  const ONE_LOCATION = env && env.ONE_LOCATION
  const LOG_LOCATION = !ONE_LOCATION ? defaultLogPath : `${ONE_LOCATION}/var`
  const SHARE_LOCATION = !ONE_LOCATION ? defaultSharePath : `${ONE_LOCATION}/share`
  const VAR_LOCATION = !ONE_LOCATION ? defaultVarPath : `${ONE_LOCATION}/var`
  const ETC_LOCATION = !ONE_LOCATION ? defaultEtcPath : `${ONE_LOCATION}/etc`
  const VMRC_LOCATION = !ONE_LOCATION ? defaultVarPath : ONE_LOCATION

  if (global) {
    if (!global.FIREEDGE_CONFIG) {
      global.FIREEDGE_CONFIG = `${ETC_LOCATION}/${defaultConfigFile}`
    }
    if (!global.VMRC_TOKENS) {
      global.VMRC_TOKENS = `${VMRC_LOCATION}/${defaultVmrcTokens}`
    }
    if (!global.FIREEDGE_LOG) {
      global.FIREEDGE_LOG = `${LOG_LOCATION}/${defaultLogFilename}`
    }
    if (!global.SUNSTONE_AUTH_PATH) {
      global.SUNSTONE_AUTH_PATH = `${VAR_LOCATION}/.one/${defaultSunstoneAuth}`
    }
    if (!global.SUNSTONE_PATH) {
      global.SUNSTONE_PATH = `${ETC_LOCATION}/${defaultSunstonePath}/`
    }
    if (!global.SUNSTONE_CONFIG) {
      global.SUNSTONE_CONFIG = `${ETC_LOCATION}/${defaultSunstonePath}/${defaultSunstoneConfig}`
    }
    if (!global.SUNSTONE_VIEWS) {
      global.SUNSTONE_VIEWS = `${ETC_LOCATION}/${defaultSunstonePath}/${defaultSunstoneViews}`
    }
    if (!global.FIREEDGE_KEY_PATH) {
      global.FIREEDGE_KEY_PATH = `${VAR_LOCATION}/.one/${defaultKeyFilename}`
    }
    if (!global.CPI) {
      global.CPI = `${VAR_LOCATION}/${defaultAppName}`
    }
    if (!global.ETC_CPI) {
      global.ETC_CPI = `${ETC_LOCATION}/${defaultAppName}`
    }
    if (!global.SHARE_CPI) {
      global.SHARE_CPI = `${SHARE_LOCATION}/oneprovision/edge-clusters`
    }
  }
}

const getParamsForObject = (params = {}, req = {}) => {
  const rtn = {}
  if (params && Object.keys(params).length > 0 && params.constructor === Object) {
    Object.entries(params).forEach(([param, value]) => {
      if (param && value && value.from && req[value.from]) {
        rtn[param] = value.name ? req[value.from][value.name] : req[value.from]
      }
    })
  }
  return rtn
}

const defaultError = (err = '', message = 'Error: %s') => ({
  color: 'red',
  message,
  error: err || ''
})

const getFiles = (path = '', recursive = false, files = []) => {
  if (path) {
    try {
      const dirs = readdirSync(path)
      dirs.forEach(dir => {
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
      messageTerminal(defaultError(error && error.message))
    }
  }
  return files
}

const getDirectories = (dir = '', errorCallback = () => undefined) => {
  const directories = []
  if (dir) {
    try {
      const files = readdirSync(dir)
      files.forEach(file => {
        const name = `${dir}/${file}`
        if (statSync(name).isDirectory()) {
          directories.push({ filename: file, path: name })
        }
      })
    } catch (error) {
      const errorMsg = (error && error.message) || ''
      messageTerminal(defaultError(errorMsg))
      errorCallback(errorMsg)
    }
  }
  return directories
}

const parsePostData = (postData = {}) => {
  const rtn = {}
  Object.entries(postData).forEach(([key, value]) => {
    try {
      rtn[key] = JSON.parse(value, (k, val) => {
        try {
          return JSON.parse(val)
        } catch (error) {
          return val
        }
      })
    } catch (error) {
      rtn[key] = value
    }
  })
  return rtn
}
module.exports = {
  fillFunctionRoute,
  addFunctionToRoute,
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
  getParamsForObject,
  returnQueryData,
  getResourceForHookConnection,
  middlewareValidateAuthWebsocket,
  middlewareValidateResourceForHookConnection,
  defaultError,
  getDirectories,
  getFiles
}
