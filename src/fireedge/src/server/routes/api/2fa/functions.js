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

const { defaults, httpCodes } = require('server/utils/constants')
const { httpResponse } = require('server/utils/server')
const { Actions } = require('server/utils/constants/commands/user')
const {
  responseOpennebula,
  getDefaultParamsOfOpennebulaCommand,
  generateNewResourceTemplate,
} = require('server/utils/opennebula')

const { writeInLogger } = require('server/utils/logger')
const { validate2FA } = require('server/utils/jwt')
const {
  generateQr2FA,
  setup2FASecret,
  verifyUserExists,
  AUTH_TYPES,
} = require('server/routes/api/auth/utils')

// user config
const {
  httpMethod,
  defaultEmptyFunction,
  default2FAOpennebulaVar,
  default2FAOpennebulaTmpVar,
} = defaults
const { ok, internalServerError } = httpCodes
const { GET } = httpMethod

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
const setup = async (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {},
  oneConnection = defaultEmptyFunction
) => {
  try {
    const verifiedUser = await verifyUserExists({
      user: userData.user,
      token: userData.password,
      connect: oneConnection,
      protocol: AUTH_TYPES.CORE,
    })
    const ID = verifiedUser?.USER?.ID

    if (!ID) throw new Error('User ID not found')

    global.pending2FA ??= new Map()
    const { secret } = global.pending2FA.get(ID)

    if (!secret) throw new Error('No pending 2FA entry for user')

    if (!validate2FA(secret, params.token)) {
      throw new Error('Invalid 2FA token')
    }

    await setup2FASecret(verifiedUser, { connect: oneConnection })

    res.locals.httpCode = httpResponse(ok)
  } catch (err) {
    writeInLogger(err)
    res.locals.httpCode = httpResponse(internalServerError)
  } finally {
    next()
  }
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
const qr = async (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {},
  oneConnection = defaultEmptyFunction
) => {
  try {
    const verifiedUser = await verifyUserExists({
      user: userData.user,
      token: userData.password,
      connect: oneConnection,
      protocol: AUTH_TYPES.CORE,
    })

    const qrCode = await generateQr2FA(verifiedUser)

    res.locals.httpCode = httpResponse(ok, { img: qrCode.imgUrl })
  } catch (err) {
    res.locals.httpCode = httpResponse(internalServerError)
  } finally {
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
