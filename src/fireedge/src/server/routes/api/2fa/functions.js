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
  const { user, password } = userData
  if (!(user && password)) {
    next()

    return
  }

  const { token } = params
  const oneConnect = oneConnection(user, password)
  getUserInfoAuthenticated(oneConnect, next, (data) => {
    const fireedge = data?.USER?.TEMPLATE?.FIREEDGE
    const secret = fireedge?.[default2FAOpennebulaTmpVar]
    if (Number.isInteger(parseInt(data?.USER?.ID, 10)) && secret && token) {
      if (check2Fa(secret, token)) {
        oneConnect({
          action: Actions.USER_UPDATE,
          parameters: [
            parseInt(data.USER.ID, 10),
            generateNewResourceTemplate(
              fireedge || {},
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
  const { user, password } = userData
  if (!(user && password)) {
    next()

    return
  }

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
        const oneConnect = oneConnection(user, password)
        getUserInfoAuthenticated(oneConnect, next, (data) => {
          if (data?.USER?.ID && data?.USER?.TEMPLATE) {
            oneConnect({
              action: Actions.USER_UPDATE,
              parameters: [
                parseInt(data.USER.ID, 10),
                generateNewResourceTemplate(
                  data.USER.TEMPLATE.FIREEDGE || {},
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
  const { user, password } = userData
  if (!(user && password)) {
    next()

    return
  }

  const oneConnect = oneConnection(user, password)
  getUserInfoAuthenticated(oneConnect, next, (data) => {
    const template = data?.USER?.TEMPLATE
    const fireedge = template?.FIREEDGE
    const sunstone = template?.SUNSTONE

    if (fireedge || sunstone) {
      let newTemplate = generateNewResourceTemplate(
        sunstone || {},
        {},
        [default2FAOpennebulaTmpVar, default2FAOpennebulaVar],
        'SUNSTONE=[%1$s]'
      )

      if (fireedge) {
        newTemplate = generateNewResourceTemplate(fireedge || {}, {}, [
          default2FAOpennebulaTmpVar,
          default2FAOpennebulaVar,
        ])
      }

      oneConnect({
        action: Actions.USER_UPDATE,
        parameters: [parseInt(data.USER.ID, 10), newTemplate, 1],
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
