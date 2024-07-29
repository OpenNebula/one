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

const btoa = require('btoa')
const { exec } = require('child_process')
const { messageTerminal } = require('server/utils/general')
const { defaults, httpCodes } = require('server/utils/constants')
const { validateAuth } = require('server/utils/jwt')
const {
  Actions: ActionsMarketApp,
} = require('server/utils/constants/commands/marketapp')
const {
  Actions: ActionsMarket,
} = require('server/utils/constants/commands/market')
const { httpResponse, executeCommand } = require('server/utils/server')
const { getSunstoneConfig } = require('server/utils/yml')
const { writeInLogger } = require('server/utils/logger')

const { defaultEmptyFunction, defaultCommandMarketApp } = defaults
const { ok, internalServerError, badRequest, notFound, unauthorized } =
  httpCodes
const httpBadRequest = httpResponse(badRequest, '', '')
const httpNotFoundRequest = httpResponse(notFound, '', '')

const appConfig = getSunstoneConfig()
const prependCommand = appConfig.sunstone_prepend || ''

/**
 * Response http request.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} httpCode - object http code
 * @param {number} httpCode.id - http code number
 * @param {string} httpCode.message - http message
 * @param {object} [httpCode.data] - http data
 * @param {string} [httpCode.file] - file path
 */
const responseHttp = (res = {}, next = defaultEmptyFunction, httpCode) => {
  if (res && res.locals && res.locals.httpCode && httpCode) {
    res.locals.httpCode = httpCode
    next()
  }
}

/**
 * Exports the marketplace app to the OpenNebula cloud.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params of http request
 * @param {number} params.id - app id
 * @param {string} params.name - app name
 * @param {number} params.datastore - app datastore
 * @param {string} [params.file] - app file
 * @param {string} [params.associated] - app associated resource
 * @param {string} [params.tag] - app tag
 * @param {string} [params.template] - app template
 * @param {string} [params.vmname] - app vm name
 * @param {object} userData - user of http request
 */
const exportApp = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  let rtn = httpBadRequest
  const { id, name, datastore, file, associated, tag, template, vmname } =
    params
  const { user, password } = userData
  if ((id && name && datastore && user, password)) {
    let message = ''
    const paramsCommand = [
      'export',
      `${id}`,
      `${name}`,
      '--datastore',
      datastore,
    ]

    file && paramsCommand.push('--file-datastore', file)
    associated === 'false' && paramsCommand.push('--no')
    tag && paramsCommand.push('--tag', tag)
    template && paramsCommand.push('--template', template)
    vmname && paramsCommand.push('--vmname', vmname)
    user && paramsCommand.push('--user', user)
    password && paramsCommand.push('--password', password)

    const executedCommand = executeCommand(
      defaultCommandMarketApp,
      paramsCommand,
      prependCommand
    )
    const response = executedCommand.success ? ok : internalServerError
    if (executedCommand.data) {
      message = executedCommand.data
    }
    rtn = httpResponse(response, message)
  }
  res.locals.httpCode = rtn
  next()
}

/**
 * Exports the marketplace app to the OpenNebula cloud.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params of http request
 * @param {number} params.id - app id
 * @param {object} userData - user of http request
 * @param {Function} oneConnection - function of xmlrpc
 */
const downloadApp = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {},
  oneConnection = defaultEmptyFunction
) => {
  const { id, token } = params
  if (!(Number.isInteger(parseInt(id, 10)) && token)) {
    responseHttp(res, next, httpNotFoundRequest)

    return
  }

  const userDataFromJWT =
    validateAuth({
      headers: { authorization: token },
    }) || {}
  const { aud, jti } = userDataFromJWT

  if (!(aud && jti)) {
    responseHttp(res, next, httpResponse(unauthorized, '', ''))

    return
  }

  const oneConnect = oneConnection(aud, jti)
  const callbackNotfound = () => responseHttp(res, next, httpNotFoundRequest)
  const market = ({ MARKETPLACE_ID, SOURCE }) => {
    Number.isInteger(parseInt(MARKETPLACE_ID, 10)) &&
      getMarket({
        oneConnect,
        id: MARKETPLACE_ID,
        success: (MARKET) => {
          const drvMessage = `<DS_DRIVER_ACTION_DATA>${MARKET}</DS_DRIVER_ACTION_DATA>`
          const drvMessageBase64 = btoa(drvMessage)
          const downloadCmd = `DRV_ACTION=${drvMessageBase64}; ${global.paths.DOWNLOADER} ${SOURCE} -`
          const filename = `one-marketplaceapp-${id}`
          res.setHeader('Content-Type', 'application/octet-stream')
          res.setHeader('Cache-Control', 'no-transform')
          res.setHeader(
            'Content-Disposition',
            `attachment; filename=${filename}`
          )
          const execChild = exec(
            downloadCmd,
            { maxBuffer: 1024 ** 3, encoding: '' },
            (error) => {
              error &&
                writeInLogger(error) &&
                messageTerminal({
                  color: 'red',
                  message: 'error download marketapp: %s',
                  error,
                })
            }
          )
          execChild.stdout.pipe(res)
        },
        error: callbackNotfound,
        parseXML: false,
      })
  }
  getMarketApp({ oneConnect, id, success: market, error: callbackNotfound })
}

/**
 * Import the marketplace VM or VM TEPLATE to the OpenNebula cloud.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params of http request
 * @param {string} [params.id] - Resource id
 * @param {string} [params.resource] - Resource name
 * @param {number} [params.marketId] - market id
 * @param {string} [params.associated=''] - associated resource
 * @param {number} [params.vmname] - vm name
 */
const importMarket = (res = {}, next = defaultEmptyFunction, params = {}) => {
  let rtn = httpBadRequest
  const { resource, id, marketId, associated, vmname } = params

  if (id && ['vm', 'vm-template'].includes(resource)) {
    let message = ''
    const paramsCommand = [resource, 'import', `${id}`]

    paramsCommand.push(associated === 'true' ? '--yes' : '--no')
    marketId && paramsCommand.push('--market', marketId)
    vmname && paramsCommand.push('--vmname', vmname)

    const executedCommand = executeCommand(
      defaultCommandMarketApp,
      paramsCommand,
      prependCommand
    )
    const response = executedCommand.success ? ok : internalServerError
    if (executedCommand.data) {
      message = executedCommand.data
    }
    rtn = httpResponse(response, message)
  }
  res.locals.httpCode = rtn
  next()
}

/**
 * Get market APP information.
 *
 * @param {object} config - config
 * @param {Function} config.oneConnect - ONE connection
 * @param {number} config.id - ID market app
 * @param {Function} config.success - callback when have data
 * @param {Function} config.error - error callback
 * @returns {undefined} one connect
 */
const getMarketApp = ({
  oneConnect = defaultEmptyFunction,
  id,
  success = defaultEmptyFunction,
  error = defaultEmptyFunction,
}) =>
  oneConnect({
    action: ActionsMarketApp.MARKETAPP_INFO,
    parameters: [parseInt(id, 10)],
    callback: (err = undefined, marketApp = {}) => {
      if (err || !(marketApp && marketApp.MARKETPLACEAPP)) {
        error()

        return
      }
      success(marketApp && marketApp.MARKETPLACEAPP)
    },
  })

/**
 * Get market information.
 *
 * @param {object} config - config
 * @param {Function} config.oneConnect - ONE connection
 * @param {number} config.id - ID market
 * @param {Function} config.success - callback when have data
 * @param {Function} config.error - error callback
 * @param {boolean} config.parseXML - parse XML data
 * @returns {undefined} one connect
 */
const getMarket = ({
  oneConnect = defaultEmptyFunction,
  id,
  success = defaultEmptyFunction,
  error = defaultEmptyFunction,
  parseXML = true,
}) =>
  oneConnect({
    action: ActionsMarket.MARKET_INFO,
    parameters: [parseInt(id, 10)],
    callback: (err = undefined, market = {}) => {
      if (err || (parseXML && !(market && market.MARKETPLACE))) {
        error()

        return
      }

      success(parseXML ? market && market.MARKETPLACE : market)
    },
    fillHookResource: false,
    parseXML,
  })

const functionRoutes = {
  exportApp,
  downloadApp,
  importMarket,
}
module.exports = functionRoutes
