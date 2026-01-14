/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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

const {
  ensureSessionStore,
  addUserSession,
  removeUserSession,
} = require('server/utils/sessions')
const speakeasy = require('speakeasy')
const { Actions } = require('server/utils/constants/commands/user')
const qrcode = require('qrcode')
const { DateTime } = require('luxon')
// eslint-disable-next-line node/no-deprecated-api
const { parse } = require('url')
const { global, Array } = require('window-or-global')
const { Actions: ActionUsers } = require('server/utils/constants/commands/user')
const { Actions: ActionZones } = require('server/utils/constants/commands/zone')
const { defaults, httpCodes } = require('server/utils/constants')
const { getFireedgeConfig, getSunstoneConfig } = require('server/utils/yml')
const { createJWT, validate2FA } = require('server/utils/jwt')
const { ok, internalServerError, unauthorized, accepted } = httpCodes
const {
  httpResponse,
  encrypt,
  getSunstoneAuth,
} = require('server/utils/server')
const {
  responseOpennebula,
  generateNewResourceTemplate,
  getDefaultParamsOfOpennebulaCommand,
} = require('server/utils/opennebula')

const {
  httpMethod,
  defaultSessionExpiration,
  default2FAOpennebulaVar,
  default2FAOpennebulaTmpVar,
  default2FAIssuer,
  defaultSessionLimitExpiration,
  defaultRememberSessionExpiration,
} = defaults

if (!global.pending2FA) {
  global.pending2FA = new Map()
}

const TFAResult = Object.freeze({
  OK: 'ok',
  NOT_SUPPORTED: 'not_supported',
  NEED_2FA_SETUP: 'need_2fa_setup',
  COMPLETE_2FA_SETUP: 'complete_2fa_setup',
  NEED_2FA_TOKEN: 'need_2fa_token',
  INVALID_2FA: 'invalid_2fa',
})

const AUTH_TYPES = Object.freeze({
  CORE: 'core',
  SAML: 'saml',
  x509: 'x509',
  REMOTE: 'remote',
})

const TFA_SUPPORTED_PROTOCOLS = new Set([AUTH_TYPES.CORE])

const { GET } = httpMethod

const { USER_INFO, USER_POOL_INFO } = ActionUsers
const { ZONE_POOL_INFO } = ActionZones

/**
 * Get dates.
 *
 * @param {object} params - Params
 * @param {boolean} params.remember - Extend token expiration time
 * @returns {object} times
 */
const getDates = ({ remember = false } = {}) => {
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
 * Check 2FA configuration.
 *
 * @param {object} userData - user data
 * @param {object} userData.USER - Full user template
 * @param {object} userData.USER.TEMPLATE - Internal template
 * @param {string|number} userData.USER.ID - User ID
 * @param {object} params - Context specific params
 * @param {string} params.tfatoken - 2FA token
 * @param {Function} params.connect - OpenNebula connector callback
 * @param {string} params.protocol - Auth protocol type
 * @returns {boolean} return if data is valid
 */
const check2FA = async (
  { USER: { TEMPLATE = {}, ID } = {} },
  { tfatoken, connect, protocol } = {}
) => {
  if (!TFA_SUPPORTED_PROTOCOLS.has(protocol)) {
    return TFAResult.NOT_SUPPORTED
  }

  const { enforce_2fa: force2FA = false } = getSunstoneConfig() ?? {}

  const MFASecret =
    TEMPLATE?.SUNSTONE?.[default2FAOpennebulaVar] ||
    TEMPLATE?.FIREEDGE?.[default2FAOpennebulaVar]

  if (!(force2FA || MFASecret)) return TFAResult.OK

  if (!MFASecret) {
    if (!tfatoken?.length) return TFAResult.NEED_2FA_SETUP
    global.pending2FA ??= new Map()
    const { secret } = global.pending2FA.get(ID)
    if (validate2FA(secret, tfatoken)) return TFAResult.COMPLETE_2FA_SETUP
  }
  if (!tfatoken?.length) return TFAResult.NEED_2FA_TOKEN
  if (!validate2FA(MFASecret, tfatoken)) return TFAResult.INVALID_2FA

  return TFAResult.OK
}

/**
 * @param {object} root0 - Params
 * @param {object} root0.USER - User info
 * @param {string} root0.USER.ID - User ID
 * @returns {object} - QR code url
 */
const generateQr2FA = async ({ USER: { ID } = {} } = {}) => {
  if (!ID) throw httpResponse(internalServerError)

  const issuer = getFireedgeConfig()?.TWO_FACTOR_AUTH_ISSUER || default2FAIssuer
  const secret = speakeasy.generateSecret({ length: 10, name: issuer })

  global.pending2FA ??= new Map()
  global.pending2FA.set(ID, { secret: secret.base32 })

  const imgUrl = await new Promise((resolve, reject) => {
    qrcode.toDataURL(secret.otpauth_url, (err, url) =>
      err ? reject(httpResponse(internalServerError)) : resolve(url)
    )
  })

  return { imgUrl }
}

/**
 * @param {object} root0 - Params
 * @param {object} root0.USER - Auth user
 * @param {string} root0.USER.ID - User ID
 * @param {object} root0.USER.TEMPLATE - User template
 * @param {object} root1 - Params
 * @param {Function} root1.connect - OpenNebula connection callback
 */
const setup2FASecret = async ({ USER: { ID, TEMPLATE } = {} }, { connect }) => {
  const { username, token } = getServerAdmin()
  const oneConnect = connect(`${username}:${username}`, token.token)

  global.pending2FA ??= new Map()
  const { secret } = global.pending2FA.get(ID)

  if (!ID || !TEMPLATE || !secret) throw httpResponse(internalServerError)

  await new Promise((resolve, reject) => {
    oneConnect({
      action: Actions.USER_UPDATE,
      parameters: [
        parseInt(ID, 10),
        generateNewResourceTemplate(
          TEMPLATE?.FIREEDGE || {},
          { [default2FAOpennebulaVar]: secret },
          [default2FAOpennebulaTmpVar]
        ),
        1,
      ],
      callback: (err) =>
        err ? reject(httpResponse(internalServerError)) : resolve(),
    })
  })
}

/**
 * Create a JWT for a user session.
 *
 * @param {object} tokenData - { token, time }
 * @param {object} userInfo - { ID, NAME, TEMPLATE }
 * @returns {object|null} { token: jwt, id, language? }
 */
const genJWT = (tokenData = {}, userInfo = {}) => {
  const rawToken = tokenData?.token
  const { ID: id, NAME: username, TEMPLATE: template } = userInfo

  if (!rawToken || !tokenData?.time || !id || !username) return null

  const jwt = createJWT({
    id,
    user: username,
    token: rawToken,
  })

  if (!jwt) return null

  const lang = template?.SUNSTONE?.LANG

  return {
    token: jwt,
    id,
    expiration: tokenData?.time,
    ...(lang && { language: lang }),
  }
}

/**
 * Get created user tokens.
 *
 * @param {string} user - Username
 * @param {object} params - Drilled props
 * @returns {object} - user token
 */
const getCreatedTokenOpennebula = (user = '', params) => {
  ensureSessionStore()
  const { nowUnix, limitExpirationReuseToken } = getDates(params)

  const tokens = global.sessionStore[user]?.tokens
  if (!user || !Array.isArray(tokens)) return

  let maxToken

  for (let i = tokens.length - 1; i >= 0; i--) {
    const { token, expires } = tokens[i]
    const exp = parseInt(expires, 10)

    if (exp <= nowUnix) {
      removeUserSession(token)
      continue
    }

    const reusableThreshold = exp - limitExpirationReuseToken * 60

    if (reusableThreshold > nowUnix) {
      if (!maxToken || exp > maxToken.expires) {
        maxToken = { token, time: exp }
      }
    }
  }

  return maxToken
}

/**
 * Get zones.
 *
 * @param {Function} connect - OpenNebula connector callback
 */
const setZones = ({ connect, next }) => {
  if (global && !global.zones) {
    connect({
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

                const data = {
                  id: oneZone.ID || '',
                  name: oneZone.NAME || '',
                  rpc: rpc,
                  zeromq: `tcp://${parsedHost}:2101`,
                }

                oneZone?.TEMPLATE?.FIREEDGE_ENDPOINT &&
                  (data.fireedge = oneZone?.TEMPLATE?.FIREEDGE_ENDPOINT)

                return data
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
 * @param {object} params - Drilled props
 * @returns {object|undefined} data encrypted serveradmin
 */
const createTokenServerAdmin = (
  { username, key, iv, serverAdmin = username },
  params
) => {
  if (username && key && iv) {
    const { expireTime } = getDates(params)
    const expire = parseInt(expireTime, 10)

    return {
      token: encrypt(`${serverAdmin}:${username}:${expire}`, key, iv),
      time: expire,
    }
  }
}

/**
 * Generate a session token for a user.
 *
 * @param {object} serverAdminData - opennebula serveradmin data
 * @param {object} userData - opennebula user data
 * @param {object} userData.USER - User template
 * @param {object} params - Drilled props
 * @returns {object} - Session token
 */
const generateSessionToken = (serverAdminData = {}, { USER = {} }, params) => {
  const { relativeTime } = getDates(params)
  const adminUser = serverAdminData?.USER
  const { NAME, ID, TEMPLATE } = USER

  const required = {
    relativeTime,
    adminName: adminUser?.NAME,
    adminPassword: adminUser?.PASSWORD,
    userName: NAME,
    userId: ID,
    template: TEMPLATE,
  }

  if (Object.values(required).some((v) => !v)) return null

  const { adminName, adminPassword, userId, userName, template } = required

  const JWTusername = `${adminName}:${userName}`

  const tokenData =
    getCreatedTokenOpennebula(JWTusername, params) ||
    createTokenServerAdmin(
      {
        serverAdmin: adminName,
        username: userName,
        key: adminPassword.substring(0, 32),
        iv: adminPassword.substring(0, 16),
      },
      params
    )

  if (!tokenData) return null

  addUserSession(JWTusername, {
    token: tokenData.token,
    expires: tokenData.time,
  })

  return genJWT(tokenData, {
    NAME: JWTusername,
    ID: userId,
    TEMPLATE: template,
  })
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

const callAsServerAdmin = async ({ connect }, action, params = []) => {
  const { username, token } = getServerAdmin()

  if (!username || !token) {
    throw httpResponse(unauthorized, '', 'serveradmin credentials missing')
  }

  return new Promise((resolve, reject) => {
    const oneConnect = connect(`${username}:${username}`, token.token)

    return oneConnect({
      action,
      parameters: params,
      callback: (err, value) => {
        if (err) reject(err)
        else resolve(value)
      },
      fillHookResource: false,
    })
  })
}

const fetchUserPool = async ({ connect }) =>
  []
    .concat(
      (
        await callAsServerAdmin(
          { connect },
          USER_POOL_INFO,
          getDefaultParamsOfOpennebulaCommand(USER_POOL_INFO, GET)
        )
      )?.USER_POOL?.USER || []
    )
    .flat()

/**
 * @param {object} params - Params
 * @param {Function} params.connect - OpenNebula connector callback
 * @returns {Promise} Promise resolving to user info call
 */
const fetchUserInfo = async ({ connect }) => {
  if (!connect) {
    throw httpResponse(unauthorized, '', 'missing connection handler')
  }

  return new Promise((resolve, reject) =>
    connect({
      action: USER_INFO,
      parameters: getDefaultParamsOfOpennebulaCommand(USER_INFO, GET),
      callback: (err, value) => {
        if (err) reject(err)
        else resolve(value)
      },
      fillHookResource: false,
    })
  )
}

const createUserSession = async (userData = {}, params) => {
  const serverAdmin = await callAsServerAdmin(
    params,
    USER_INFO,
    getDefaultParamsOfOpennebulaCommand(USER_INFO, GET)
  )

  if (!serverAdmin) throw httpResponse(internalServerError)

  const session = generateSessionToken(serverAdmin, userData, params)
  if (!session) throw httpResponse(internalServerError)

  return session
}

/**
 * @param {string} status - TFAResult status
 * @param {object} userData - User data object
 * @param {params} params - All passed down props like router control + one connector
 * @returns {object} - Response containing httpCode & payload
 */
const resolveTFAResponse = async (status, userData, params) => {
  switch (status) {
    case TFAResult.NOT_SUPPORTED:
    case TFAResult.OK:
      return {
        httpCode: ok,
        payload: {
          status: TFAResult.OK,
        },
        session: await createUserSession(userData, params), // Session should NOT be included in payload, these are passed as httpOnly cookies
      }
    case TFAResult.NEED_2FA_SETUP:
      return {
        httpCode: accepted,
        payload: {
          ...(await generateQr2FA(userData)),
          status,
        },
      }
    case TFAResult.COMPLETE_2FA_SETUP:
      await setup2FASecret(userData, params)

      global.pending2FA.delete(userData.USER.ID)

      return {
        httpCode: ok,
        payload: {
          status: TFAResult.OK,
        },
        session: await createUserSession(userData, params),
      }
    case TFAResult.NEED_2FA_TOKEN:
      return { httpCode: accepted, payload: { status } }

    case TFAResult.INVALID_2FA:
      return { httpCode: unauthorized, payload: { status } }

    default:
      return null
  }
}

/**
 *
 * @param {object} params - Params
 * @param {object|string} params.user - User object or username
 * @param {Function} params.connect - OpenNebula connection callback
 * @param {string} params.token - User token
 * @param {string} params.protocol - Authentication protocol
 * @returns {object} - User template when found
 */
const verifyUserExists = async ({ user, token, connect, protocol }) => {
  switch (protocol) {
    case AUTH_TYPES.SAML:
    case AUTH_TYPES.CORE: {
      const userData = await fetchUserInfo({ connect: connect(user, token) })
      if (!userData?.USER) {
        throw httpResponse(unauthorized, '', 'core user not found')
      }

      return userData
    }

    case AUTH_TYPES.x509: {
      const userPool = await fetchUserPool({ connect })
      if (!userPool?.length) {
        throw httpResponse(unauthorized, '', 'user pool empty')
      }

      const parsed = /,/.test(user) ? user.split(',').reverse().join('/') : user

      const found = userPool.find(
        (u) => u.PASSWORD.includes(parsed) && u.AUTH_DRIVER === 'x509'
      )

      if (!found) {
        throw httpResponse(unauthorized, '', 'x509 user not found')
      }

      return { USER: found }
    }

    case AUTH_TYPES.REMOTE: {
      const userPool = await fetchUserPool({ connect })
      if (!userPool?.length) {
        throw httpResponse(unauthorized, '', 'user pool empty')
      }

      const [usr, pss = usr] = user.split(':')

      const found = userPool.find(
        (u) =>
          u.NAME === usr && u.PASSWORD === pss && u.AUTH_DRIVER === 'public'
      )

      if (!found) {
        throw httpResponse(unauthorized, '', 'remote user not found')
      }

      return { USER: found }
    }

    default:
      throw httpResponse(unauthorized, '', 'auth protocol unsupported')
  }
}

module.exports = {
  fetchUserInfo,
  generateQr2FA,
  createTokenServerAdmin,
  getCreatedTokenOpennebula,
  getServerAdmin,
  verifyUserExists,
  check2FA,
  resolveTFAResponse,
  setZones,
  setup2FASecret,
  AUTH_TYPES,
}
