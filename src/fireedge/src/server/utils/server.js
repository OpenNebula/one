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
const { env } = require('process')
const { Map } = require('immutable')
const { existsSync, readFileSync, createWriteStream } = require('fs-extra')

const { internalServerError } = require('./constants/http-codes')
const { messageTerminal } = require('server/utils/general')
const {
  defaultLogFilename,
  defaultLogPath,
  defaultVmrcTokens,
  defaultVarPath,
  defaultKeyFilename,
  defaultWebpackMode,
  defaultOpennebulaZones
} = require('./constants/defaults')

let cert = ''
let key = ''

const validateServerIsSecure = () => {
  const folder = '../cert/'
  const path = process && process.env && process.env.NODE_ENV === defaultWebpackMode ? `${__dirname}/../../${folder}` : `${__dirname}/${folder}`
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

const existsFile = (path = '', callback = () => undefined, error = () => undefined) => {
  let rtn = false
  try {
    const file = readFileSync(path, 'utf8')
    if (path && file) {
      callback(file)
      rtn = true
    }
  } catch (err) {
    error(err)
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
              const config = {
                color: 'red',
                message: 'Error: %s',
                type: err.message || ''
              }
              messageTerminal(config)
            })
        }
      )
    }
    global.FIREEDGE_KEY = uuidv4
  }
}

const getDataZone = (zone = 0, configuredZones) => {
  let rtn
  const Zones = (global && global.zones) || configuredZones || defaultOpennebulaZones
  if (Zones && Array.isArray(Zones)) {
    rtn = Zones[0]
    if (zone !== null) {
      rtn = Zones.find(
        zone => zone && zone.ID !== undefined && String(zone.ID) === zone
      )
    }
  }
  return rtn
}

const genPathResources = () => {
  const ONE_LOCATION = env && env.ONE_LOCATION
  const LOG_LOCATION = !ONE_LOCATION ? defaultLogPath : `${ONE_LOCATION}/var`
  const VAR_LOCATION = !ONE_LOCATION ? defaultVarPath : `${ONE_LOCATION}/var`
  const VMRC_LOCATION = !ONE_LOCATION ? defaultVarPath : ONE_LOCATION

  if (global) {
    if (!global.VMRC_TOKENS) {
      global.VMRC_TOKENS = `${VMRC_LOCATION}/${defaultVmrcTokens}`
    }
    if (!global.FIREEDGE_LOG) {
      global.FIREEDGE_LOG = `${LOG_LOCATION}/${defaultLogFilename}`
    }
    if (!global.FIREEDGE_KEY_PATH) {
      global.FIREEDGE_KEY_PATH = `${VAR_LOCATION}/.one/${defaultKeyFilename}`
    }
  }
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
  getKey
}
