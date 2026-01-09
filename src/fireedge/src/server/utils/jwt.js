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

const jwt = require('jwt-simple')
const speakeasy = require('speakeasy')
const { messageTerminal } = require('server/utils/general')
const { JWTError, MissingFireEdgeKeyError } = require('server/utils/errors')
const { defaults } = require('server/utils/constants')
const { defaultJwtCookieName } = defaults

/**
 * Create a JWT.
 *
 * @param {object} jwtData - object of data to JWT {ID, USER, Opennebula_token}
 * @param {string} jwtData.id - user ID
 * @param {string} jwtData.user - username
 * @param {string} jwtData.token - token opennebula
 * @returns {string} JWT
 */
const createJWT = ({ id, user, token }) => {
  if (id && user && token) {
    return jwtEncode({
      iss: id, // user ID
      aud: user, // user name
      jti: token, // token
    })
  }
}

/**
 * Encode JWT.
 *
 * @param {object} payload - data object
 * @returns {object} - jwt or null
 */
const jwtEncode = (payload = {}) => {
  let rtn = null
  if (global && global.paths && global.paths.FIREEDGE_KEY) {
    rtn = jwt.encode(payload, global.paths.FIREEDGE_KEY)
  }

  return rtn
}

/**
 * Decode JWT.
 *
 * @param {string} token - token JWT
 * @returns {object} data JWT
 */
const jwtDecode = (token = '') => {
  if (global?.paths?.FIREEDGE_KEY) {
    try {
      return jwt.decode(token, global.paths.FIREEDGE_KEY)
    } catch (error) {
      throw new JWTError(error.message)
    }
  } else {
    throw new MissingFireEdgeKeyError()
  }
}

/**
 * Validate auth (JWT).
 *
 * @param {object} req - http request
 * @returns {object} return data of JWT
 */
const validateAuth = (req = {}) => {
  if (req?.cookies?.[defaultJwtCookieName]) {
    try {
      const rawCookie = req.cookies[defaultJwtCookieName]

      const parsed =
        typeof rawCookie === 'string' ? JSON.parse(rawCookie) : rawCookie

      const token = parsed?.token
      if (!token) return false

      const payload = jwtDecode(token)
      const { iss, aud, jti } = payload

      if (!iss || !aud || !jti) return false

      return {
        iss,
        aud,
        jti,
      }
    } catch (error) {
      messageTerminal({
        color: 'red',
        error: `${error.stack}`,
      })
    }
  }
}

/**
 * Check 2FA.
 *
 * @param {string} secret - secret key
 * @param {string} token - token JWT
 * @returns {string} data decoded
 */
const validate2FA = (secret = '', token = '') => {
  if (!secret || !token) return false

  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
  })
}

module.exports = {
  jwtDecode,
  createJWT,
  validateAuth,
  validate2FA,
}
