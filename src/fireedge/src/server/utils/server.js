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
const { existsSync, readFileSync, createWriteStream } = require('fs-extra')
const { internalServerError } = require('./constants/http-codes')
const { messageTerminal } = require('server/utils/general')
const { validateAuth } = require('server/utils/jwt')
const {
  defaultAppName,
  defaultConfigFile,
  defaultLogFilename,
  defaultLogPath,
  defaultSharePath,
  defaultVmrcTokens,
  defaultVarPath,
  defaultKeyFilename,
  defaultWebpackMode,
  defaultOpennebulaZones,
  defaultEtcPath
} = require('./constants/defaults')

let cert = ''
let key = ''

const validateServerIsSecure = () => {
  const folder = '../cert/'
  const path = env && env.NODE_ENV === defaultWebpackMode ? `${__dirname}/../../${folder}` : `${__dirname}/${folder}`
  cert = `${path}cert.pem`
  key = `${path}key.pem`
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

const authWebsocket = (server = {}, next = () => undefined) => {
  if (
    server &&
    server.handshake &&
    server.handshake.query &&
    server.handshake.query.token &&
    validateAuth({
      headers: { authorization: server.handshake.query.token }
    })
  ) {
    next()
  } else {
    server.disconnect(true)
  }
}

const existsFile = (path = '', success = () => undefined, error = () => undefined) => {
  let rtn = false
  let file
  let errorData
  try {
    const fileData = readFileSync(path, 'utf8')
    if (path && fileData) {
      file = fileData
      rtn = true
    }
  } catch (err) {
    errorData = (err && err.message) || ''
    messageTerminal({
      color: 'red',
      message: 'Error: %s',
      type: errorData
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
                type: (err && err.message) || ''
              })
            })
        }
      )
    }
    global.FIREEDGE_KEY = uuidv4
  }
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
    if (!global.FIREEDGE_KEY_PATH) {
      global.FIREEDGE_KEY_PATH = `${VAR_LOCATION}/.one/${defaultKeyFilename}`
    }
    if (!global.CPI) {
      console.log('-->', defaultAppName)
      global.CPI = `${VAR_LOCATION}/${defaultAppName}`
    }
    if (!global.ETC_CPI) {
      global.ETC_CPI = `${ETC_LOCATION}/${defaultAppName}`
    }
    if (!global.SHARE_CPI) {
      global.SHARE_CPI = `${SHARE_LOCATION}/oneprovision`
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
  getDataZone,
  existsFile,
  createFile,
  httpResponse,
  validateServerIsSecure,
  genPathResources,
  genFireedgeKey,
  getCert,
  getKey,
  parsePostData,
  getParamsForObject,
  authWebsocket
}
