/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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

const { DateTime } = require('luxon')
// eslint-disable-next-line node/no-deprecated-api
const { parse } = require('url')
const { global, Array } = require('window-or-global')
const { Actions: ActionUsers } = require('server/utils/constants/commands/user')
const { Actions: ActionZones } = require('server/utils/constants/commands/zone')
const {
  httpMethod,
  defaultOpennebulaExpiration,
  default2FAOpennebulaVar,
  defaultNamespace,
  defaultEmptyFunction
} = require('server/utils/constants/defaults')
const { getConfig } = require('server/utils/yml')
const {
  ok,
  unauthorized,
  accepted,
  internalServerError
} = require('server/utils/constants/http-codes')
const { createJWT, check2Fa } = require('server/utils/jwt')
const { httpResponse, encrypt, getSunstoneAuth } = require('server/utils/server')
const {
  responseOpennebula,
  getDefaultParamsOfOpennebulaCommand
} = require('server/utils/opennebula')

const appConfig = getConfig()

const namespace = appConfig.namespace || defaultNamespace

const { GET } = httpMethod

let user = ''
let key = ''
let iv = ''
let pass = ''
let type = ''
let tfatoken = ''
let extended = ''
let next = defaultEmptyFunction
let req = {}
let res = {}
let nodeConnect = defaultEmptyFunction
let now = ''
let nowUnix = ''
let nowWithMinutes = ''
let relativeTime = ''

/**
 * Get key opennebula.
 *
 * @returns {string} get key
 */
const getKey = () => key

/**
 * Get initialization vector.
 *
 * @returns {string} get initialization vector
 */
const getIV = () => iv

/**
 * Get user opennebula.
 *
 * @returns {string} user opennebula
 */
const getUser = () => user

/**
 * Get user password openebula.
 *
 * @returns {string} get password user opennebula
 */
const getPass = () => pass

/**
 * Get relative time.
 *
 * @returns {string} date
 */
const getRelativeTime = () => relativeTime

/**
 * Opennebula encode-decode key.
 *
 * @param {string} newKey - new key
 * @returns {string} get key
 */
const setKey = newKey => {
  key = newKey
  return key
}

/**
 * Initialization vector (encrypt).
 *
 * @param {string} newIV - //16 characters
 * @returns {string} get IV
 */
const setIV = newIV => {
  iv = newIV
  return iv
}

/**
 * Username opennebula.
 *
 * @param {string} newUser - new user data
 * @returns {string} get user
 */
const setUser = newUser => {
  user = newUser
  return user
}

/**
 * User  password opennebula.
 *
 * @param {string} newPass - set new opennebula password user
 * @returns {string} password user
 */
const setPass = newPass => {
  pass = newPass
  return pass
}

/**
 * Type app.
 *
 * @param {string} newtype - new type (application)
 * @returns {string} get type
 */
const setType = newtype => {
  type = newtype
  return type
}

/**
 * Set 2FA token.
 *
 * @param {string} newTfaToken - new TFA token
 * @returns {string} get TFA token
 */
const setTfaToken = newTfaToken => {
  tfatoken = newTfaToken
  return tfatoken
}

/**
 * Set extended.
 *
 * @param {boolean} newExtended - new extended
 * @returns {boolean} extended
 */
const setExtended = newExtended => {
  extended = newExtended
  return extended
}

/**
 * Set express stepper.
 *
 * @param {Function} newNext - new stepper
 * @returns {Function} http response
 */
const setNext = (newNext = defaultEmptyFunction) => {
  next = newNext
  return next
}

/**
 * Set http resquest.
 *
 * @param {object} newReq - new request
 * @returns {object} http resquest
 */
const setReq = (newReq = {}) => {
  req = newReq
  return req
}

/**
 * Set xlmrpc connection function.
 *
 * @param {Function} newConnect - new connect opennebula
 * @returns {Function} xmlrpc function
 */
const setNodeConnect = (newConnect = defaultEmptyFunction) => {
  nodeConnect = newConnect
  return nodeConnect
}

/**
 * Set http response.
 *
 * @param {object} newRes - new response
 * @returns {object} http response
 */
const setRes = (newRes = {}) => {
  res = newRes
  return res
}

/**
 * Set dates.
 */
const setDates = () => {
  const limitToken = appConfig.opennebula_expiration || defaultOpennebulaExpiration
  now = DateTime.local()
  nowUnix = now.toSeconds()
  nowWithMinutes = now.plus({ minutes: limitToken })
  const diff = nowWithMinutes.diff(now, 'seconds')
  relativeTime = diff.seconds
}

/**
 * Connect to function xmlrpc.
 *
 * @param {string} usr - user
 * @param {string} pss - password
 * @returns {Function} xmlrpc function
 */
const connectOpennebula = (usr = '', pss = '') => {
  const connectUser = usr || user
  const connectPass = pss || pass
  return nodeConnect(connectUser, connectPass)
}

/**
 * Updater http request.
 *
 * @param {string} code - http code
 */
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

/**
 * Validate 2FA.
 *
 * @param {object} informationUser - user data
 * @returns {boolean} return if data is valid
 */
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

/**
 * Generate a JWT.
 *
 * @param {string} token - opennebula token
 * @param {object} informationUser - user data
 */
const genJWT = (token, informationUser) => {
  if (token && token.token && informationUser && informationUser.ID && informationUser.NAME) {
    const { ID: id, TEMPLATE: userTemplate, NAME: user } = informationUser
    const dataJWT = { id, user, token: token.token }
    const addTime = token.expiration_time || nowWithMinutes.toSeconds()
    const jwt = createJWT(dataJWT, nowUnix, addTime)
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

/**
 * Get zones.
 */
const setZones = () => {
  if (global && !global.zones) {
    const oneConnect = connectOpennebula()
    oneConnect(
      ActionZones.ZONEPOOL_INFO,
      getDefaultParamsOfOpennebulaCommand(ActionZones.ZONEPOOL_INFO, GET),
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

/**
 * Create token server admin.
 *
 * @param {string} serverAdmin - serveradmin name
 * @param {string} username - user name
 * @returns {string} data encrypted serveradmin
 */
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

/**
 * Wrap user with serveradmin.
 *
 * @param {object} serverAdminData - opennebula serveradmin data
 * @param {object} userData - opennebula user data
 */
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

/**
 * Get server admin and wrap user.
 *
 * @param {object} userData - opennebula user data
 */
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
      ActionUsers.USER_INFO,
      getDefaultParamsOfOpennebulaCommand(ActionUsers.USER_INFO, GET),
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

/**
 * Login route function.
 *
 * @param {object} userData - opennebula user data
 */
const login = userData => {
  let rtn = false
  if (userData) {
    const findTextError = `[${namespace}${ActionUsers.USER_INFO}]`
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
