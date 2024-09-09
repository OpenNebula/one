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
const { genPathResources } = require('server/utils/server')
const { getZone } = require('server/routes/entrypoints/Api/middlawares')
const {
  endpointExternalGuacamole,
  defaultPort,
  defaultProtocol,
} = require('server/utils/constants/defaults')

genPathResources()

const appConfig = getFireedgeConfig()
const port = appConfig.port || defaultPort
const protocol = defaultProtocol
const url = `${protocol}://localhost:${port}`

const getZoneUrl = (req) => {
  let zoneURL = ''
  const externalURL = req?.url
  if (externalURL) {
    const parsedURL = parse(externalURL, true)
    const zone = parsedURL?.query?.zone

    if (zone) {
      const dataZone = getZone(zone)
      if (dataZone?.fireedge) {
        zoneURL = dataZone?.fireedge
      } else {
        const URL = dataZone.rpc
        const zoneDataURL = parse(URL)
        zoneURL = `${protocol}://${zoneDataURL.hostname}:${defaultPort}`
      }
    }
  }

  return zoneURL
}

const setHeaders = (proxyReq, req) => {
  Object.keys(req.headers).forEach((header) => {
    if (header.toLowerCase().startsWith('sec-websocket-')) {
      proxyReq.setHeader(header, req.headers[header])
    }
  })
  const externalURL = getZoneUrl(req)
  externalURL && proxyReq.setHeader('Origin', externalURL)
}

const guacamoleProxy = createProxyMiddleware(endpointExternalGuacamole, {
  target: url,
  changeOrigin: true,
  ws: true,
  secure: /^(https):\/\/[^ "]+$/.test(url),
  pathRewrite: (path) => path.replace('/external-guacamole', '/guacamole'),
  onProxyReqWs: setHeaders,
  onProxyReq: setHeaders,
  router: (req) => getZoneUrl(req),
})

module.exports = guacamoleProxy
