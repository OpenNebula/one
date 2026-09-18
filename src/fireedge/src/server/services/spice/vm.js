/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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
const { endpointSpice } = require('server/utils/constants/defaults')
const { Actions: vmActions } = require('server/utils/constants/commands/vm')
const { httpResponse } = require('server/utils/server')
const { createSpiceSession } = require('server/services/spice/session')

const { defaultEmptyFunction } = defaults
const { badRequest, ok, unauthorized } = httpCodes
const { VM_INFO } = vmActions

const getSpiceGraphics = (vm = {}) =>
  [vm?.TEMPLATE?.GRAPHICS ?? []]
    .flat()
    .find(({ TYPE } = {}) => `${TYPE}`.toLowerCase() === 'spice')

const getVmHost = (vm = {}) => {
  const history = [vm?.HISTORY_RECORDS?.HISTORY ?? []].flat()

  return history[history.length - 1]?.HOSTNAME
}

/**
 * Generates a short-lived session for the SPICE websocket proxy.
 * VM information is requested with the current user's credentials, so the
 * regular OpenNebula authorization rules are enforced.
 *
 * @param {object} res - HTTP response
 * @param {Function} next - Express stepper
 * @param {object} params - Request parameters
 * @param {string|number} params.id - VM id
 * @param {object} userData - Authenticated user
 * @param {Function} xmlrpc - XML-RPC connection factory
 */
const generateSpiceSession = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {},
  xmlrpc = defaultEmptyFunction
) => {
  res.set?.('Cache-Control', 'no-store')

  const vmId = Number(params.id)
  const { user, password } = userData

  if (!Number.isInteger(vmId) || vmId < 0) {
    res.locals.httpCode = httpResponse(badRequest, 'Invalid VM id')
    next()

    return
  }

  if (!user || !password) {
    res.locals.httpCode = httpResponse(unauthorized)
    next()

    return
  }

  const oneClient = xmlrpc(user, password)

  oneClient({
    action: VM_INFO,
    parameters: [vmId, true],
    callback: (error, { VM } = {}) => {
      if (error || !VM) {
        res.locals.httpCode = httpResponse(unauthorized, error)
        next()

        return
      }

      const graphics = getSpiceGraphics(VM)
      const host = getVmHost(VM)
      const port = Number(graphics?.PORT)

      if (`${VM.STATE}` !== '3') {
        res.locals.httpCode = httpResponse(
          badRequest,
          'The VM must be active to open a SPICE console'
        )
      } else if (!graphics) {
        res.locals.httpCode = httpResponse(
          badRequest,
          'The VM does not have SPICE graphics configured'
        )
      } else if (!host || !Number.isInteger(port) || port < 1 || port > 65535) {
        res.locals.httpCode = httpResponse(
          badRequest,
          'The VM does not have a valid SPICE endpoint'
        )
      } else {
        const { token, expiresIn } = createSpiceSession({
          host,
          port,
          vmId,
        })

        res.locals.httpCode = httpResponse(ok, {
          websocket: `${endpointSpice}/${token}`,
          password: `${graphics.PASSWD ?? ''}`,
          expiresIn,
        })
      }

      next()
    },
  })
}

module.exports = { generateSpiceSession }
