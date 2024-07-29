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

const { DateTime } = require('luxon')
// eslint-disable-next-line node/no-deprecated-api
const { parse } = require('url')
const { global, Array } = require('window-or-global')
const { Actions: ActionUsers } = require('server/utils/constants/commands/user')
const { Actions: ActionZones } = require('server/utils/constants/commands/zone')
const { defaults, httpCodes } = require('server/utils/constants')
const { getFireedgeConfig } = require('server/utils/yml')
const { createJWT, check2Fa } = require('server/utils/jwt')
const {
  httpResponse,
  encrypt,
  getSunstoneAuth,
} = require('server/utils/server')
const {
  responseOpennebula,
  getDefaultParamsOfOpennebulaCommand,
} = require('server/utils/opennebula')

const {
  httpMethod,
  defaultSessionExpiration,
  default2FAOpennebulaVar,
  defaultNamespace,
  defaultEmptyFunction,
  defaultSessionLimitExpiration,
  defaultRememberSessionExpiration,
} = defaults

const { ok, unauthorized, accepted, internalServerError } = httpCodes

const { GET } = httpMethod

const { USER_INFO, USER_POOL_INFO } = ActionUsers
const { ZONE_POOL_INFO } = ActionZones

let user = ''
let pass = ''
let type = ''
let tfatoken = ''
let remember = false
let next = defaultEmptyFunction
let req = {}
let res = {}
let nodeConnect = defaultEmptyFunction

/**
 * Get user opennebula.
 *
 * @returns {string} user opennebula
 */
const getUser = () => user

/**
 * Get user password opennebula.
 *
 * @returns {string} get password user opennebula
 */
const getPass = () => pass

/**
 * Username opennebula.
 *
 * @param {string} newUser - new user data
 * @returns {string} get user
 */
const setUser = (newUser) => {
  user = newUser

  return user
}

/**
 * User  password opennebula.
 *
 * @param {string} newPass - set new opennebula password user
 * @returns {string} password user
 */
const setPass = (newPass) => {
  pass = newPass

  return pass
}

/**
 * Type app.
 *
 * @param {string} newtype - new type (application)
 * @returns {string} get type
 */
const setType = (newtype) => {
  type = newtype

  return type
}

/**
 * Set 2FA token.
 *
 * @param {string} newTfaToken - new TFA token
 * @returns {string} get TFA token
 */
const setTfaToken = (newTfaToken) => {
  tfatoken = newTfaToken

  return tfatoken
}

/**
 * Set remember.
 *
 * @param {boolean} newRemember - new remember
 * @returns {boolean} remember
 */
const setRemember = (newRemember) => {
  remember = newRemember

  return remember
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
 *
 * @returns {object} times
 */
const setDates = () => {
  const appConfig = getFireedgeConfig()
  const limitToken = remember
    ? appConfig.session_remember_expiration || defaultRememberSessionExpiration
    : appConfig.session_expiration || defaultSessionExpiration
  const limitExpirationReuseToken =
    parseInt(appConfig.minimum_opennebula_expiration, 10) ||
    defaultSessionLimitExpiration
  const now = DateTime.local()
  const expireTime = now.plus({ minutes: limitToken })
  const diff = expireTime.diff(now, 'seconds')

  return {
    now,
    nowUnix: now.toSeconds(),
    limitToken,
    limitExpirationReuseToken,
    expireTime: expireTime.toSeconds(),
    relativeTime: diff.seconds,
  }
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
const updaterResponse = (code) => {
  if ('id' in code && 'message' in code && res?.locals?.httpCode) {
    res.locals.httpCode = code
  }
}

/**
 * Validate 2FA.
 *
 * @param {object} informationUser - user data
 * @returns {boolean} return if data is valid
 */
const validate2faAuthentication = (informationUser) => {
  let rtn = false
  const template = informationUser?.TEMPLATE
  if (
    template?.SUNSTONE?.[default2FAOpennebulaVar] ||
    template?.FIREEDGE?.[default2FAOpennebulaVar]
  ) {
    /*********************************************************
     * Validate 2FA
     *
     * Gives priority to the 2FA created directly in the fireedge and in case it is not configured, uses the 2FA created from the sunstone.
     *********************************************************/

    if (tfatoken.length <= 0) {
      updaterResponse(httpResponse(accepted, { id: informationUser?.ID }))
    } else {
      const secret =
        template.FIREEDGE?.[default2FAOpennebulaVar] ||
        template.SUNSTONE?.[default2FAOpennebulaVar]
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
  if (
    token?.time &&
    token?.token &&
    informationUser?.ID &&
    informationUser?.NAME
  ) {
    const { ID: id, TEMPLATE: userTemplate, NAME: username } = informationUser
    const jwt = createJWT({ id, user: username, token: token.token })

    if (jwt) {
      const rtn = { token: jwt, id }
      if (userTemplate?.SUNSTONE?.LANG) {
        rtn.language = userTemplate.SUNSTONE.LANG
      }
      updaterResponse(httpResponse(ok, rtn))
    }
  }
}

/**
 * Get created user tokens.
 *
 * @param {string} username - username
 * @returns {object} - user token
 */
const getCreatedTokenOpennebula = (username = '') => {
  const { now, nowUnix, limitExpirationReuseToken } = setDates()
  if (username && global?.users?.[username]?.tokens) {
    let acc = { token: '', time: 0 }
    global.users[username].tokens.forEach((curr = {}, index = 0) => {
      const tokenExpirationTime = parseInt(curr.time, 10)

      // this delete expired tokens of global.users[username]
      if (tokenExpirationTime <= nowUnix) {
        delete global.users[username].tokens[index]
      }

      // this select a valid token
      if (
        DateTime.fromSeconds(tokenExpirationTime).minus({
          minutes: limitExpirationReuseToken,
        }) > now &&
        tokenExpirationTime > acc.time
      ) {
        acc = { token: curr.token, time: curr.time }
      }
    })
    if (acc.token && acc.time) {
      return acc
    }
  }
}

/**
 * Get zones.
 */
const setZones = () => {
  if (global && !global.zones) {
    const oneConnect = connectOpennebula()
    oneConnect({
      action: ZONE_POOL_INFO,
      parameters: getDefaultParamsOfOpennebulaCommand(ZONE_POOL_INFO, GET),
      callback: (err, value) => {
        // res, err, value, response, next
        responseOpennebula(
          () => undefined,
          err,
          value,
          (zonesOpennebula) => {
            if (
              zonesOpennebula &&
              zonesOpennebula.ZONE_POOL &&
              zonesOpennebula.ZONE_POOL.ZONE
            ) {
              const oneZones = !Array.isArray(zonesOpennebula.ZONE_POOL.ZONE)
                ? [zonesOpennebula.ZONE_POOL.ZONE]
                : zonesOpennebula.ZONE_POOL.ZONE
              global.zones = oneZones.map((oneZone) => {
                const rpc = oneZone?.TEMPLATE?.ENDPOINT || ''
                const parsedURL = rpc && parse(rpc)
                const parsedHost = parsedURL.hostname || ''

                return {
                  id: oneZone.ID || '',
                  name: oneZone.NAME || '',
                  rpc: rpc,
                  zeromq: `tcp://${parsedHost}:2101`,
                }
              })
            }
          },
          next
        )
      },
      fillHookResource: false,
    })
  }
}

/**
 * Create token server admin.
 *
 * @param {object} config - config create  token serveradmin
 * @param {string} config.username - user name
 * @param {string} config.key - serverAdmin key
 * @param {string} config.iv - serverAdmin iv
 * @param {string} config.serverAdmin - serverAdmin username
 * @returns {object|undefined} data encrypted serveradmin
 */
const createTokenServerAdmin = ({
  username,
  key,
  iv,
  serverAdmin = username,
}) => {
  if (username && key && iv) {
    const { expireTime } = setDates()
    const expire = parseInt(expireTime, 10)

    return {
      token: encrypt(`${serverAdmin}:${username}:${expire}`, key, iv),
      time: expire,
    }
  }
}

/**
 * Wrap user with serveradmin.
 *
 * @param {object} serverAdminData - opennebula serveradmin data
 * @param {object} userData - opennebula user data
 */
const wrapUserWithServerAdmin = (serverAdminData = {}, userData = {}) => {
  let serverAdminName = ''
  let serverAdminPassword = ''
  let userName = ''
  const { relativeTime, expireTime } = setDates()

  if (
    relativeTime &&
    serverAdminData?.USER &&
    (serverAdminName = serverAdminData.USER.NAME) &&
    (serverAdminPassword = serverAdminData.USER.PASSWORD) &&
    userData &&
    (userName = userData.NAME) &&
    userData.ID &&
    userData.TEMPLATE
  ) {
    const JWTusername = `${serverAdminName}:${userName}`

    let tokenWithServerAdmin
    let setGlobalNewToken = false
    const validToken = getCreatedTokenOpennebula(JWTusername)
    if (validToken) {
      tokenWithServerAdmin = validToken
    } else {
      setGlobalNewToken = true
      tokenWithServerAdmin = createTokenServerAdmin({
        serverAdmin: serverAdminName,
        username: userName,
        /*********************************************************
         * equals what is placed in:
         * src/authm_mad/remotes/server_cipher/server_cipher_auth.rb:44
         *********************************************************/
        key: serverAdminPassword.substring(0, 32),
        iv: serverAdminPassword.substring(0, 16),
      })
    }

    if (tokenWithServerAdmin) {
      // set global state
      if (setGlobalNewToken) {
        if (!global.users) {
          global.users = {}
        }
        if (!global.users[JWTusername]) {
          global.users[JWTusername] = { tokens: [] }
        }
        !validToken &&
          global.users[JWTusername].tokens.push({
            token: tokenWithServerAdmin.token,
            time: parseInt(expireTime, 10),
          })
      }

      genJWT(tokenWithServerAdmin, {
        NAME: JWTusername,
        ID: userData.ID,
        TEMPLATE: userData.TEMPLATE,
      })

      next()
    }
  } else {
    updaterResponse(httpResponse(internalServerError))
    next()
  }
}

/**
 * Get server admin.
 *
 * @returns {object|undefined} data serveradmin
 */
const getServerAdmin = () => {
  const serverAdminData = getSunstoneAuth()
  const { username, key, iv } = serverAdminData
  if (username && key && iv) {
    return {
      ...serverAdminData,
      token: createTokenServerAdmin({
        serverAdmin: username,
        username,
        key,
        iv,
      }),
    }
  }
}

/**
 * Get server admin and wrap user.
 *
 * @param {object} userData - opennebula user data
 */
const getServerAdminAndWrapUser = (userData = {}) => {
  const serverAdminData = getServerAdmin()
  const { username, token } = serverAdminData
  if (username && token) {
    const oneConnect = connectOpennebula(`${username}:${username}`, token.token)
    oneConnect({
      action: USER_INFO,
      parameters: getDefaultParamsOfOpennebulaCommand(USER_INFO, GET),
      callback: (err, value) => {
        responseOpennebula(
          updaterResponse,
          err,
          value,
          (serverAdmin = {}) => wrapUserWithServerAdmin(serverAdmin, userData),
          next
        )
      },
      fillHookResource: false,
    })
  }
}

/**
 * Remote login route function.
 *
 * @param {string} userData - user remote data user:password
 */
const remoteLogin = (userData = '') => {
  const serverAdminData = getServerAdmin()
  const { username, token } = serverAdminData
  const [usr, pss = usr] = userData.split(':')
  if (username && token && usr && pss) {
    const oneConnect = connectOpennebula(`${username}:${username}`, token.token)
    oneConnect({
      action: USER_POOL_INFO,
      parameters: getDefaultParamsOfOpennebulaCommand(USER_POOL_INFO, GET),
      callback: (_, value) => {
        const users = value?.USER_POOL?.USER || []
        if (users.length) {
          const userFound = users.find(
            (data) =>
              data.NAME === usr &&
              data.PASSWORD === pss &&
              data.AUTH_DRIVER === 'public'
          )
          if (userFound) {
            setZones()
            getServerAdminAndWrapUser(userFound)
          } else {
            next()
          }
        }
      },
      fillHookResource: false,
    })
  }
}

/**
 * Login route function.
 *
 * @param {object} userData - opennebula user data
 */
const login = (userData) => {
  let rtn = false
  if (userData) {
    const appConfig = getFireedgeConfig()
    const namespace = appConfig.namespace || defaultNamespace
    const findTextError = `[${namespace}.${USER_INFO}]`
    if (userData.indexOf && userData.indexOf(findTextError) >= 0) {
      updaterResponse(httpResponse(unauthorized))
    } else {
      rtn = true
    }
    if (userData.USER) {
      setZones()
      if (validate2faAuthentication(userData.USER)) {
        rtn = false
        getServerAdminAndWrapUser(userData.USER)
      }
    }
  }
  if (rtn) {
    next()
  }
}

module.exports = {
  login,
  getUser,
  getPass,
  setType,
  setUser,
  setPass,
  setTfaToken,
  setRemember,
  setNext,
  setReq,
  setRes,
  updaterResponse,
  setNodeConnect,
  connectOpennebula,
  getCreatedTokenOpennebula,
  createTokenServerAdmin,
  remoteLogin,
  getServerAdmin,
}
