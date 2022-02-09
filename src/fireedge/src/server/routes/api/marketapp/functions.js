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

const { sprintf } = require('sprintf-js')
const { request: axios } = require('axios')
const { defaults, httpCodes } = require('server/utils/constants')
const {
  Actions: ActionsMarketApp,
} = require('server/utils/constants/commands/marketapp')
const {
  Actions: ActionsMarket,
} = require('server/utils/constants/commands/market')
const { httpResponse, executeCommand } = require('server/utils/server')
const { getSunstoneConfig } = require('server/utils/yml')

const { defaultEmptyFunction, defaultCommandMarketApp, dockerUrl } = defaults
const { ok, internalServerError, badRequest, notFound } = httpCodes
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
  if (id && name && datastore) {
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
 * Import the marketplace VM or VM TEPLATE to the OpenNebula cloud.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params of http request
 * @param {number} [params.vmId] - vm id
 * @param {number} [params.templateId] - template id
 * @param {number} [params.marketId] - market id
 * @param {string} [params.associated=''] - associated resource
 * @param {number} [params.vmname] - vm name
 */
const importMarket = (res = {}, next = defaultEmptyFunction, params = {}) => {
  let rtn = httpBadRequest
  const { vmId, templateId, marketId, associated, vmname } = params
  const resource = vmId ? 'vm' : 'vm-template'
  const id = vmId || templateId
  if (id) {
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
 * Request tags docker.
 *
 * @param {string} url - url
 * @param {Function} success - success function
 * @param {Function} error - error function
 */
const getTagsDocker = (
  url = '',
  success = defaultEmptyFunction,
  error = defaultEmptyFunction
) => {
  axios({
    method: 'GET',
    url,
    headers: {
      'User-Agent': 'OpenNebula',
    },
    validateStatus: (status) => status >= 200 && status <= 400,
  })
    .then(({ data }) => {
      success(data || '')
    })
    .catch(() => {
      error()
    })
}

/**
 * Get market APP information.
 *
 * @param {Function} oneConnection - ONE connection
 * @param {number} id - ID market app
 * @param {Function} success - callback when have data
 * @param {Function} error - error callback
 */
const getMarketApp = (
  oneConnection = defaultEmptyFunction,
  id,
  success = defaultEmptyFunction,
  error = defaultEmptyFunction
) => {
  oneConnection(
    ActionsMarketApp.MARKETAPP_INFO,
    [parseInt(id, 10)],
    (err = undefined, marketApp = {}) => {
      if (err || !(marketApp && marketApp.MARKETPLACEAPP)) {
        error()

        return
      }
      success(marketApp && marketApp.MARKETPLACEAPP)
    }
  )
}

/**
 * Get market information.
 *
 * @param {Function} oneConnection - ONE connection
 * @param {number} id - ID market
 * @param {Function} success - callback when have data
 * @param {Function} error - error callback
 */
const getMarket = (
  oneConnection = defaultEmptyFunction,
  id,
  success = defaultEmptyFunction,
  error = defaultEmptyFunction
) => {
  oneConnection(
    ActionsMarket.MARKET_INFO,
    [parseInt(id, 10)],
    (err = undefined, market = {}) => {
      if (err || !(market && market.MARKETPLACE)) {
        error()

        return
      }
      success(market && market.MARKETPLACE)
    }
  )
}

/**
 * Get Docker Hub Tags.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params of http request
 * @param {number} params.id - market id
 * @param {number} [params.page] - page number
 * @param {object} userData - user data.
 * @param {string} userData.user - ONE username
 * @param {string} userData.password - ONE password
 * @param {Function} oneConnection - xmlrpc function
 */
const getDockerTags = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {},
  oneConnection = defaultEmptyFunction
) => {
  const { id, page } = params
  const { user, password } = userData
  if (id && user && password) {
    const connect = oneConnection(user, password)

    const callbackNotfound = () => responseHttp(res, next, httpNotFoundRequest)
    const callbackBadRequest = () => responseHttp(res, next, httpBadRequest)
    const market = ({ MARKETPLACE_ID, NAME: MARKETAPP_NAME }) => {
      Number.isInteger(parseInt(MARKETPLACE_ID)) &&
        getMarket(
          connect,
          MARKETPLACE_ID,
          ({ MARKET_MAD }) => {
            if (MARKET_MAD !== 'dockerhub') {
              return callbackBadRequest()
            }

            let url = sprintf(dockerUrl, MARKETAPP_NAME)
            if (page) {
              url += `&page=${page}`
            }
            getTagsDocker(
              url,
              (tags) => responseHttp(res, next, httpResponse(ok, tags)),
              callbackNotfound
            )
          },
          callbackNotfound
        )
    }
    getMarketApp(connect, id, market, callbackNotfound)
  } else {
    responseHttp(res, next, httpNotFoundRequest)
  }
}

const functionRoutes = {
  exportApp,
  importMarket,
  getDockerTags,
}
module.exports = functionRoutes
