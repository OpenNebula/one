/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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

const speakeasy = require('speakeasy')
const qrcode = require('qrcode')
const { defaults, httpCodes } = require('server/utils/constants')
const { httpResponse } = require('server/utils/server')
const { getFireedgeConfig } = require('server/utils/yml')
const { check2Fa } = require('server/utils/jwt')
const { Actions } = require('server/utils/constants/commands/user')
const {
  responseOpennebula,
  getDefaultParamsOfOpennebulaCommand,
  generateNewResourceTemplate,
} = require('server/utils/opennebula')

// user config
const appConfig = getFireedgeConfig()
const {
  httpMethod,
  default2FAIssuer,
  defaultEmptyFunction,
  default2FAOpennebulaVar,
  default2FAOpennebulaTmpVar,
} = defaults
const { ok, unauthorized, internalServerError } = httpCodes
const { GET } = httpMethod
const twoFactorAuthIssuer = appConfig.TWO_FACTOR_AUTH_ISSUER || default2FAIssuer

/**
 * Get information for opennebula authenticated user.
 *
 * @param {Function} oneConnect - xmlrpc function
 * @param {Function} next - express stepper
 * @param {Function} callback - run if have user information
 */
const getUserInfoAuthenticated = (
  oneConnect = defaultEmptyFunction,
  next = defaultEmptyFunction,
  callback = defaultEmptyFunction
) => {
  oneConnect({
    action: Actions.USER_INFO,
    parameters: getDefaultParamsOfOpennebulaCommand(Actions.USER_INFO, GET),
    callback: (err, value) => {
      responseOpennebula(
        () => undefined,
        err,
        value,
        (info) => {
          if (info !== undefined && info !== null) {
            callback(info)
          } else {
            next()
          }
        },
        next
      )
    },
  })
}

/**
 * Add 2FA user.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params of http request
 * @param {string} [params.token] - params of http request
 * @param {object} userData - user of http request
 * @param {Function} oneConnection - function of xmlrpc
 */
const setup = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {},
  oneConnection = defaultEmptyFunction
) => {
  const { token } = params
  const oneConnect = oneConnection()
  getUserInfoAuthenticated(oneConnect, next, (user) => {
    if (
      user &&
      user.USER &&
      user.USER.ID &&
      user.USER.TEMPLATE &&
      user.USER.TEMPLATE.SUNSTONE &&
      user.USER.TEMPLATE.SUNSTONE[default2FAOpennebulaTmpVar] &&
      token
    ) {
      const sunstone = user.USER.TEMPLATE.SUNSTONE
      const secret = sunstone[default2FAOpennebulaTmpVar]
      if (check2Fa(secret, token)) {
        oneConnect({
          action: Actions.USER_UPDATE,
          parameters: [
            parseInt(user.USER.ID, 10),
            generateNewResourceTemplate(
              user.USER.TEMPLATE.SUNSTONE || {},
              { [default2FAOpennebulaVar]: secret },
              [default2FAOpennebulaTmpVar]
            ),
            1,
          ],
          callback: (error, value) => {
            responseOpennebula(
              () => undefined,
              error,
              value,
              (pass) => {
                if (pass !== undefined && pass !== null) {
                  res.locals.httpCode = httpResponse(ok)
                }
                next()
              },
              next
            )
          },
        })
      } else {
        res.locals.httpCode = httpResponse(unauthorized)
        next()
      }
    } else {
      next()
    }
  })
}

/**
 * Generate QR.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params of http request
 * @param {object} userData - user of http request
 * @param {Function} oneConnection - function of xmlrpc
 */
const qr = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {},
  oneConnection = defaultEmptyFunction
) => {
  const secret = speakeasy.generateSecret({
    length: 10,
    name: twoFactorAuthIssuer,
  })
  if (secret && secret.otpauth_url && secret.base32) {
    const { otpauth_url: otpURL, base32 } = secret
    qrcode.toDataURL(otpURL, (err, dataURL) => {
      if (err) {
        res.locals.httpCode = httpResponse(internalServerError)
        next()
      } else {
        const oneConnect = oneConnection()
        getUserInfoAuthenticated(oneConnect, next, (user) => {
          if (user && user.USER && user.USER.ID && user.USER.TEMPLATE) {
            oneConnect({
              action: Actions.USER_UPDATE,
              parameters: [
                parseInt(user.USER.ID, 10),
                generateNewResourceTemplate(
                  user.USER.TEMPLATE.SUNSTONE || {},
                  { [default2FAOpennebulaTmpVar]: base32 },
                  [default2FAOpennebulaVar]
                ),
                1,
              ],
              callback: (error, value) => {
                responseOpennebula(
                  () => undefined,
                  error,
                  value,
                  (pass) => {
                    if (pass !== undefined && pass !== null) {
                      res.locals.httpCode = httpResponse(ok, {
                        img: dataURL,
                      })
                      next()
                    } else {
                      next()
                    }
                  },
                  next
                )
              },
            })
          } else {
            next()
          }
        })
      }
    })
  } else {
    next()
  }
}

/**
 * Delete 2fa.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params of http request
 * @param {object} userData - user of http request
 * @param {Function} oneConnection - function of xmlrpc
 */
const del = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {},
  oneConnection = defaultEmptyFunction
) => {
  const oneConnect = oneConnection()
  getUserInfoAuthenticated(oneConnect, next, (user) => {
    if (
      user &&
      user.USER &&
      user.USER.ID &&
      user.USER.TEMPLATE &&
      user.USER.TEMPLATE.SUNSTONE
    ) {
      oneConnect({
        action: Actions.USER_UPDATE,
        parameters: [
          parseInt(user.USER.ID, 10),
          generateNewResourceTemplate(user.USER.TEMPLATE.SUNSTONE || {}, {}, [
            default2FAOpennebulaTmpVar,
            default2FAOpennebulaVar,
          ]),
          1,
        ],
        callback: (err, value) => {
          responseOpennebula(
            () => undefined,
            err,
            value,
            (pass) => {
              if (pass !== undefined && pass !== null) {
                res.locals.httpCode = httpResponse(ok)
              }
              next()
            },
            next
          )
        },
      })
    }
  })
}
const tfaApi = {
  setup,
  qr,
  del,
}
module.exports = tfaApi
