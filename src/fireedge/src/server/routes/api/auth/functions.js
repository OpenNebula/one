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
const {
  from,
  httpMethod,
  defaultOpennebulaExpiration,
  defaultOpennebulaMinimumExpiration,
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
  accepted
} = require('server/utils/constants/http-codes')
const { createToken } = require('server/utils/jwt')
const { httpResponse } = require('server/utils/server')
const {
  responseOpennebula,
  checkOpennebulaCommand,
  check2Fa
} = require('server/utils/opennebula')
// eslint-disable-next-line node/no-deprecated-api
const { parse } = require('url')
const { global, Array } = require('window-or-global')

const appConfig = getConfig()

const namespace = appConfig.namespace || defaultNamespace
const minimumExpirationTime = appConfig.minimun_opennebula_expiration || defaultOpennebulaMinimumExpiration

const { POST } = httpMethod

const getOpennebulaMethod = checkOpennebulaCommand(defaultMethodLogin, POST)

let user = ''
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

const getUser = () => user
const getPass = () => pass
const getRelativeTime = () => relativeTime

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

const connectOpennebula = () => nodeConnect(user, pass)

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
    // without 2FA login
    rtn = true
  }
  return rtn
}

const genJWT = (token, informationUser) => {
  if (token && token.token && informationUser && informationUser.ID && informationUser.PASSWORD) {
    const { ID: id, TEMPLATE: userTemplate } = informationUser
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
      }
    )
  }
}

const login = userData => {
  let rtn = true
  if (userData) {
    const findTextError = `[${namespace + defaultMethodUserInfo}]`
    if (userData.indexOf && userData.indexOf(findTextError) >= 0) {
      updaterResponse(httpResponse(unauthorized))
    }
    if (userData.USER) {
      setZones()
      if (validate2faAuthentication(userData.USER)) {
        rtn = false
        checkOpennebulaToken(userData.USER)
      }
    }
  }
  if (rtn) {
    next()
  }
}

const checkOpennebulaToken = userData => {
  setDates()
  if (userData && userData.LOGIN_TOKEN) {
    const loginTokens = Array.isArray(userData.LOGIN_TOKEN) ? userData.LOGIN_TOKEN : [userData.LOGIN_TOKEN]
    const token = getValidOpennebulaToken(loginTokens)
    if (token) {
      genJWT(token, userData)
      next()
    } else {
      createOpennebulaToken(userData)
    }
  } else {
    createOpennebulaToken(userData)
  }
}

const getValidOpennebulaToken = userDataTokens => {
  let rtn
  if (Array.isArray(userDataTokens)) {
    const validToken = userDataTokens.find(token => {
      now = DateTime.local()
      nowUnix = now.toSeconds()
      return (
        token &&
        token.TOKEN &&
        token.EGID &&
        token.EGID === '-1' &&
        token.EXPIRATION_TIME &&
        parseInt(token.EXPIRATION_TIME, 10) >= nowUnix + (parseInt(minimumExpirationTime, 10) * 60)
      )
    })
    if (validToken && validToken.TOKEN && validToken.EXPIRATION_TIME) {
      rtn = {
        token: validToken.TOKEN,
        expiration_time: validToken.EXPIRATION_TIME
      }
    }
  }
  return rtn
}

const createOpennebulaToken = userData => {
  const relativeTime = getRelativeTime()
  const dataSourceWithExpirateDate = Map(req).toObject()
  // add expire time unix for opennebula creation token
  dataSourceWithExpirateDate[from.postBody].expire = relativeTime
  dataSourceWithExpirateDate[from.postBody].token = ''

  const oneConnect = connectOpennebula()
  oneConnect(
    defaultMethodLogin,
    getOpennebulaMethod(dataSourceWithExpirateDate),
    (err, value) => {
      responseOpennebula(
        updaterResponse,
        err,
        value,
        token => authenticate(token, userData),
        next)
    }
  )
}

const authenticate = (token, userData) => {
  const findTextError = `[${namespace + defaultMethodLogin}]`
  if (token && userData) {
    if (token.indexOf(findTextError) < 0) {
      genJWT({ token }, userData)
    }
  }
  next()
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
