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
const { DateTime } = require('luxon')
const { Map } = require('immutable')
// eslint-disable-next-line node/no-deprecated-api
const { parse } = require('url')
const { global, Array } = require('window-or-global')
const { createHash } = require('crypto')

const {
  httpMethod,
  defaultOpennebulaExpiration,
  defaultMethodLogin,
  defaultMethodZones,
  defaultMethodUserInfo,
  default2FAOpennebulaVar,
  defaultNamespace
} = require('server/utils/constants/defaults')
const { getConfig } = require('server/utils/yml')
const {
  ok,
  unauthorized,
  accepted,
  internalServerError
} = require('server/utils/constants/http-codes')
const { createToken } = require('server/utils/jwt')
const { httpResponse, encrypt, getSunstoneAuth } = require('server/utils/server')
const {
  responseOpennebula,
  checkOpennebulaCommand,
  check2Fa
} = require('server/utils/opennebula')

const appConfig = getConfig()

const namespace = appConfig.namespace || defaultNamespace

const { POST } = httpMethod

const getOpennebulaMethod = checkOpennebulaCommand(defaultMethodLogin, POST)

let user = ''
let key = ''
let iv = ''
let pass = ''
let type = ''
let tfatoken = ''
let extended = ''
let next = () => undefined
let req = {}
let res = {}
let nodeConnect = () => undefined
let now = ''
let nowUnix = ''
let nowWithMinutes = ''
let relativeTime = ''

const dataSourceWithExpirateDate = () => Map(req).toObject()

const getKey = () => key
const getIV = () => iv
const getUser = () => user
const getPass = () => pass
const getRelativeTime = () => relativeTime

const setKey = newKey => {
  key = newKey
  return key
}

const setIV = newIV => {
  iv = newIV
  return iv
}

const setUser = newUser => {
  user = newUser
  return user
}

const setPass = newPass => {
  pass = newPass
  return pass
}

const setType = newtype => {
  type = newtype
  return type
}

const setTfaToken = newTfaToken => {
  tfatoken = newTfaToken
  return tfatoken
}

const setExtended = newExtended => {
  extended = newExtended
  return extended
}
const setNext = newNext => {
  next = newNext
  return next
}
const setReq = newReq => {
  req = newReq
  return req
}
const setNodeConnect = newConnect => {
  nodeConnect = newConnect
  return nodeConnect
}

const setRes = newRes => {
  res = newRes
  return res
}

const setDates = () => {
  const limitToken = appConfig.opennebula_expiration || defaultOpennebulaExpiration
  now = DateTime.local()
  nowUnix = now.toSeconds()
  nowWithMinutes = now.plus({ minutes: limitToken })
  const diff = nowWithMinutes.diff(now, 'seconds')
  relativeTime = diff.seconds
}

const connectOpennebula = (usr = '', pss = '') => {
  const connectUser = usr || user
  const connectPass = pss || pass
  return nodeConnect(connectUser, connectPass)
}

const updaterResponse = code => {
  if (
    'id' in code &&
    'message' in code &&
    res &&
    res.locals &&
    res.locals.httpCode
  ) {
    res.locals.httpCode = code
  }
}

const validate2faAuthentication = informationUser => {
  let rtn = false
  if (
    informationUser.TEMPLATE &&
    informationUser.TEMPLATE.SUNSTONE &&
    informationUser.TEMPLATE.SUNSTONE[default2FAOpennebulaVar]
  ) {
    /*********************************************************
      * Validate 2FA
    *********************************************************/

    if (tfatoken.length <= 0) {
      updaterResponse(httpResponse(accepted))
    } else {
      const secret = informationUser.TEMPLATE.SUNSTONE[default2FAOpennebulaVar]
      if (!check2Fa(secret, tfatoken)) {
        updaterResponse(httpResponse(unauthorized, '', 'invalid 2fa token'))
      } else {
        rtn = true
      }
    }
  } else {
    /*********************************************************
      * Without 2FA
    *********************************************************/

    rtn = true
  }
  return rtn
}

const genJWT = (token, informationUser) => {
  if (token && token.token && informationUser && informationUser.ID && informationUser.NAME) {
    const { ID: id, TEMPLATE: userTemplate, NAME: user } = informationUser
    const dataJWT = { id, user, token: token.token }
    const addTime = token.expiration_time || nowWithMinutes.toSeconds()
    const jwt = createToken(dataJWT, nowUnix, addTime)
    if (jwt) {
      if (!global.users) {
        global.users = {}
      }
      global.users[user] = { token: token.token }
      const rtn = { token: jwt, id }
      if (userTemplate && userTemplate.SUNSTONE && userTemplate.SUNSTONE.LANG) {
        rtn.language = userTemplate.SUNSTONE.LANG
      }
      updaterResponse(httpResponse(ok, rtn))
    }
  }
}

const setZones = () => {
  if (global && !global.zones) {
    const oneConnect = connectOpennebula()
    const dataSource = dataSourceWithExpirateDate()
    oneConnect(
      defaultMethodZones,
      getOpennebulaMethod(dataSource),
      (err, value) => {
        // res, err, value, response, next
        responseOpennebula(
          () => undefined,
          err,
          value,
          zonesOpennebula => {
            if (
              zonesOpennebula &&
              zonesOpennebula.ZONE_POOL &&
              zonesOpennebula.ZONE_POOL.ZONE
            ) {
              const oneZones = !Array.isArray(zonesOpennebula.ZONE_POOL.ZONE)
                ? [zonesOpennebula.ZONE_POOL.ZONE]
                : zonesOpennebula.ZONE_POOL.ZONE
              global.zones = oneZones.map(oneZone => {
                const rpc = (oneZone && oneZone.TEMPLATE && oneZone.TEMPLATE.ENDPOINT) || ''
                const parsedURL = rpc && parse(rpc)
                const parsedHost = parsedURL.hostname || ''
                return {
                  id: oneZone.ID || '',
                  name: oneZone.NAME || '',
                  rpc: rpc,
                  zeromq: `tcp://${parsedHost}:2101`
                }
              })
            }
          },
          next
        )
      },
      false
    )
  }
}

const createTokenServerAdmin = (serverAdmin = '', username = '') => {
  let rtn
  const key = getKey()
  const iv = getIV()
  if (serverAdmin && username && key && iv) {
    rtn = encrypt(
      `${serverAdmin}:${username}:${parseInt(nowWithMinutes.toSeconds())}`,
      key,
      iv
    )
  }
  return rtn
}

const wrapUserWithServerAdmin = (serverAdminData = {}, userData = {}) => {
  const relativeTime = getRelativeTime()
  let serverAdminName = ''
  let serverAdminPassword = ''
  let userName = ''

  if (
    relativeTime &&
    serverAdminData &&
    serverAdminData.USER &&
    (serverAdminName = serverAdminData.USER.NAME) &&
    (serverAdminPassword = serverAdminData.USER.PASSWORD) &&
    userData &&
    (userName = userData.NAME) &&
    userData.ID &&
    userData.TEMPLATE
  ) {
    /*********************************************************
      * equals what is placed in:
      * src/authm_mad/remotes/server_cipher/server_cipher_auth.rb:44
    *********************************************************/
    setKey(serverAdminPassword.substring(0, 32))
    setIV(serverAdminPassword.substring(0, 16))

    const tokenWithServerAdmin = createTokenServerAdmin(serverAdminName, userName)
    if (tokenWithServerAdmin) {
      genJWT(
        {
          token: tokenWithServerAdmin
        },
        {
          NAME: `${serverAdminName}:${userName}`,
          ID: userData.ID,
          TEMPLATE: userData.TEMPLATE
        }
      )
      next()
    }
  } else {
    updaterResponse(httpResponse(internalServerError))
    next()
  }
}

const getServerAdminAndWrapUser = (userData = {}) => {
  const serverAdminData = getSunstoneAuth()
  if (serverAdminData &&
    serverAdminData.username &&
    serverAdminData.key &&
    serverAdminData.iv
  ) {
    setKey(serverAdminData.key)
    setIV(serverAdminData.iv)
    const tokenWithServerAdmin = createTokenServerAdmin(serverAdminData.username, serverAdminData.username)
    const oneConnect = connectOpennebula(`${serverAdminData.username}:${serverAdminData.username}`, tokenWithServerAdmin)
    oneConnect(
      defaultMethodUserInfo,
      [-1, false],
      (err, value) => {
        responseOpennebula(
          updaterResponse,
          err,
          value,
          (serverAdminData = {}) => wrapUserWithServerAdmin(serverAdminData, userData),
          next)
      },
      false
    )
  }
}

const login = userData => {
  let rtn = false
  if (userData) {
    const findTextError = `[${namespace + defaultMethodUserInfo}]`
    if (userData.indexOf && userData.indexOf(findTextError) >= 0) {
      updaterResponse(httpResponse(unauthorized))
    } else {
      rtn = true
    }
    if (userData.USER) {
      setZones()
      if (validate2faAuthentication(userData.USER)) {
        rtn = false
        setDates()
        getServerAdminAndWrapUser(userData.USER)
      }
    }
  }
  if (rtn) {
    next()
  }
}

const functionRoutes = {
  login,
  getUser,
  getPass,
  setType,
  setUser,
  setPass,
  setTfaToken,
  setExtended,
  setNext,
  setReq,
  setRes,
  updaterResponse,
  setNodeConnect,
  connectOpennebula
}

module.exports = functionRoutes
