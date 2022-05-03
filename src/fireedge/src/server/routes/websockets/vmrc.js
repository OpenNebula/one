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

// eslint-disable-next-line node/no-deprecated-api
const { parse } = require('url')
const { createProxyMiddleware } = require('http-proxy-middleware')
const { getFireedgeConfig } = require('server/utils/yml')
const { messageTerminal } = require('server/utils/general')
const {
  genPathResources,
  validateServerIsSecure,
} = require('server/utils/server')
const { writeInLogger } = require('server/utils/logger')
const { endpointVmrc, defaultPort } = require('server/utils/constants/defaults')

genPathResources()

const appConfig = getFireedgeConfig()
const port = appConfig.port || defaultPort
const protocol = validateServerIsSecure() ? 'https' : 'http'
const url = `${protocol}://localhost:${port}`
const config = {
  color: 'red',
}
const vmrcProxy = createProxyMiddleware(endpointVmrc, {
  target: url,
  changeOrigin: false,
  ws: true,
  secure: /^(https):\/\/[^ "]+$/.test(url),
  logLevel: 'debug',
  pathRewrite: (path) => path.replace(endpointVmrc, '/ticket'),
  onError: (err) => {
    config.error = err.message
    config.message = 'Error connection : %s'
    messageTerminal(config)
  },
  // eslint-disable-next-line consistent-return
  router: (req) => {
    if (req && req.url) {
      const parseURL = parse(req.url)
      if (parseURL && parseURL.pathname) {
        const ticket = parseURL.pathname.split('/')[3]
        writeInLogger(ticket, {
          format: 'path to vmrc token: %s',
          level: 2,
        })
        if (global && global.vcenterToken && global.vcenterToken[ticket]) {
          return global.vcenterToken[ticket]
        } else {
          writeInLogger(ticket, {
            format: 'Non-existent token: %s',
            level: 2,
          })
        }
      }
    }
  },
})

/**
 * VMRC Proxy.
 *
 * @param {object} appServer - express app
 */
const vmrc = (appServer) => {
  if (
    appServer &&
    appServer.on &&
    appServer.constructor &&
    appServer.constructor.name &&
    appServer.constructor.name === 'Server'
  ) {
    appServer.on('upgrade', vmrcProxy.upgrade)
  }
}

module.exports = vmrc
