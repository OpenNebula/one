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

// eslint-disable-next-line node/no-deprecated-api
const { parse } = require('url')
const { createProxyMiddleware } = require('http-proxy-middleware')
const { getFireedgeConfig } = require('server/utils/yml')
const {
  genPathResources,
  validateServerIsSecure,
} = require('server/utils/server')
const { writeInLogger } = require('server/utils/logger')
const { endpointVmrc, defaultPort } = require('server/utils/constants/defaults')

genPathResources()

const logger = (message = '', format = '%s') =>
  writeInLogger(message, {
    format,
    level: 2,
  })

const appConfig = getFireedgeConfig()
const port = appConfig.port || defaultPort
const protocol = validateServerIsSecure() ? 'https' : 'http'
const url = `${protocol}://localhost:${port}`
const vmrcProxy = createProxyMiddleware(endpointVmrc, {
  target: url,
  changeOrigin: false,
  ws: true,
  secure: /^(https):\/\/[^ "]+$/.test(url),
  logLevel: 'debug',
  logProvider: () => ({
    log: logger,
    debug: logger,
    info: logger,
    warn: logger,
    error: logger,
  }),
  pathRewrite: (path) => path.replace(endpointVmrc, '/ticket'),
  onProxyReqWs: (_, __, socket) => {
    socket.on('error', (err) => {
      logger(err?.message || '', 'WebSocket Error connection : %s')
      socket.end()
    })
  },
  onOpen: (proxySocket) => {
    const message = `vCenter: ${proxySocket?.remoteAddress}:${proxySocket?.remotePort}`
    logger(message, 'WebSocket connection openned %s')

    proxySocket.on('error', (err) => {
      logger(err?.message || '', 'Error connection (onOpen) : %s')
    })

    proxySocket.on('close', (hadError) => {
      logger(hadError || 'cleanly', 'Connection closed (onOpen) : %s')
    })
  },
  onClose: (_, socket) => {
    socket.on('end', () => {
      logger('onClose', 'Socket end event (%s)')
    })

    socket.on('close', (hadError) => {
      logger(hadError || 'cleanly', 'Connection closed (onClose) : %s')
    })

    socket.on('error', (err) => {
      logger(err?.message || '', 'Error connection (onClose) : %s')
    })
  },
  onError: (err, _, res) => {
    logger(err?.message || '', 'Error connection : %s')
    res?.status?.(500)?.send?.('VMRC proxy error')
  },
  // eslint-disable-next-line consistent-return
  router: (req) => {
    if (req?.url) {
      const parseURL = parse(req.url)

      if (parseURL?.pathname) {
        const ticket = parseURL.pathname.split('/')[3]
        logger(ticket, 'Path to VMRC token: %s')

        if (global?.vcenterToken?.[ticket]) {
          const fullUrl = `${protocol}://${req.headers.host}${
            parseURL.pathname
          }${parseURL.search || ''}`
          logger(fullUrl, 'Full URL of incoming request: %s')
          logger(global.vcenterToken[ticket], 'vCenter token: %s')

          return global.vcenterToken[ticket]
        } else {
          logger(ticket, 'Non-existent token: %s')
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
  if (appServer && appServer?.on && appServer?.constructor?.name === 'Server') {
    appServer.on('upgrade', vmrcProxy.upgrade)
  }
}

module.exports = vmrc
