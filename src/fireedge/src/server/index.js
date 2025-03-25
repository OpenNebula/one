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

import {
  entrypoint404,
  entrypointApi,
  entrypointApp,
} from './routes/entrypoints'
import {
  defaultAppName,
  defaultApps,
  defaultEvents,
  defaultHost,
  defaultPort,
  defaultWebpackMode,
  endpointExternalGuacamole,
} from './utils/constants/defaults'
import { getLoggerMiddleware, initLogger } from './utils/logger'
import {
  genFireedgeKey,
  genPathResources,
  setDnsResultOrder,
} from './utils/server'

import compression from 'compression'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import http from 'http'
import { resolve } from 'path'
import guacamole from './routes/websockets/guacamole'
import guacamoleProxy from './routes/websockets/guacamoleProxy'
import opennebulaWebsockets from './routes/websockets/opennebula'
import { messageTerminal } from './utils/general'
import { getFireedgeConfig } from './utils/yml'

setDnsResultOrder()

// set paths
genPathResources()

const appConfig = getFireedgeConfig()

// set fireedge_key
genFireedgeKey()

// set logger
initLogger(appConfig.debug_level, appConfig.truncate_max_length)

const app = express()
const basename = defaultAppName ? `/${defaultAppName}` : ''

let frontPath = 'client'
let remoteModulesPath = 'modules'

if (process.env.NODE_ENV === defaultWebpackMode) {
  frontPath = `../../dist/${frontPath}`
  remoteModulesPath = `../../dist/${remoteModulesPath}`
}

// settings
const host = appConfig.host || defaultHost
const port = appConfig.port || defaultPort

app.use(helmet.xssFilter())
app.use(helmet.hidePoweredBy())
app.use(compression())
app.use(`${basename}/client`, express.static(resolve(__dirname, frontPath)))
app.use(`${basename}/client/*`, express.static(resolve(__dirname, frontPath)))

// Remote modules serving
app.use(
  `${basename}/modules`,
  express.static(resolve(__dirname, remoteModulesPath))
)
app.use(
  `${basename}/modules/*`,
  express.static(resolve(__dirname, remoteModulesPath))
)

const loggerMiddleware = getLoggerMiddleware()
if (loggerMiddleware) {
  app.use(loggerMiddleware)
}

// CORS
if (appConfig.cors) {
  app.use(cors())
}
// post params parser body
app.use(express.urlencoded({ extended: false }))
app.use(express.json())

app.use(`${basename}/api`, entrypointApi) // OpenNebula Api routes
const frontApps = Object.keys(defaultApps)
frontApps.forEach((frontApp) => {
  app.get(`${basename}/${frontApp}`, entrypointApp)
  app.get(`${basename}/${frontApp}/*`, entrypointApp)
})
app.get('/*', (_, res) => res.redirect(`/${defaultAppName}/sunstone`))
// 404 - public
app.get('*', entrypoint404)

const appServer = http.createServer(app)

const websockets = opennebulaWebsockets(appServer) || []

let config = {
  color: 'red',
  message: 'Server could not be started',
}

guacamole(appServer)

appServer.on('upgrade', (req, socket, head) => {
  const url = req?.url

  if (url.startsWith(endpointExternalGuacamole)) {
    guacamoleProxy.upgrade(req, socket, head)
  }
})

appServer.listen(port, host, (err) => {
  if (!err) {
    config = {
      color: 'green',
      error: `${host}:${port}`,
      message: 'Server listen in %s',
    }
  }
  messageTerminal(config)
})

/**
 * Handle sigterm and sigint.
 */
const handleBreak = () => {
  websockets.forEach((socket) => {
    if (socket && socket.close && typeof socket.close === 'function') {
      socket.close()
    }
  })
  process.exit(0)
}
defaultEvents.forEach((nameEvent = '') => {
  if (nameEvent) {
    process.on(nameEvent, handleBreak)
  }
})
