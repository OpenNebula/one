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

import {
  defaultAppName,
  defaultApps,
  defaultEvents,
  defaultHost,
  defaultPort,
  defaultWebpackMode,
} from './utils/constants/defaults'
import {
  entrypoint404,
  entrypointApi,
  entrypointApp,
} from './routes/entrypoints'
import {
  genFireedgeKey,
  genPathResources,
  getCert,
  getKey,
  validateServerIsSecure,
  setDnsResultOrder,
} from './utils/server'
import { getLoggerMiddleware, initLogger } from './utils/logger'

import compression from 'compression'
import cors from 'cors'
import { env } from 'process'
import express from 'express'
import { getFireedgeConfig } from './utils/yml'
import guacamole from './routes/websockets/guacamole'
import helmet from 'helmet'
import http from 'http'
import https from 'https'
import { messageTerminal } from './utils/general'
import opennebulaWebsockets from './routes/websockets/opennebula'
import { readFileSync } from 'fs-extra'
import { resolve } from 'path'
import vmrc from './routes/websockets/vmrc'
import webpack from 'webpack'

setDnsResultOrder()

// set paths
genPathResources()

const appConfig = getFireedgeConfig()

// set fireedge_key
genFireedgeKey()

// set logger
initLogger(appConfig.debug_level, appConfig.truncate_max_length)

// destructure imports
const unsecureServer = http.createServer
const secureServer = https.createServer

const app = express()
const basename = defaultAppName ? `/${defaultAppName}` : ''

let frontPath = 'client'

// settings
const host = appConfig.host || defaultHost
const port = appConfig.port || defaultPort

if (env?.NODE_ENV === defaultWebpackMode) {
  try {
    const webpackConfig = require('../../webpack.config.dev.client')
    const compiler = webpack(webpackConfig)

    app.use(
      // eslint-disable-next-line import/no-extraneous-dependencies
      require('webpack-dev-middleware')(compiler, {
        publicPath: webpackConfig.output.publicPath,
      })
    )

    app.use(
      // eslint-disable-next-line import/no-extraneous-dependencies
      require('webpack-hot-middleware')(compiler, {
        path: '/__webpack_hmr',
        heartbeat: 10 * 1000,
      })
    )
  } catch (error) {
    if (error) {
      messageTerminal({
        color: 'red',
        error,
      })
    }
  }
  frontPath = '../client'
}
app.use(helmet.xssFilter())
app.use(helmet.hidePoweredBy())
app.use(compression())
app.use(`${basename}/client`, express.static(resolve(__dirname, frontPath)))
app.use(`${basename}/client/*`, express.static(resolve(__dirname, frontPath)))

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

app.use(`${basename}/api`, entrypointApi) // opennebula Api routes
const frontApps = Object.keys(defaultApps)
frontApps.forEach((frontApp) => {
  app.get(`${basename}/${frontApp}`, entrypointApp)
  app.get(`${basename}/${frontApp}/*`, entrypointApp)
})
app.get('/*', (_, res) => res.redirect(`/${defaultAppName}/sunstone`))
// 404 - public
app.get('*', entrypoint404)

const appServer = validateServerIsSecure()
  ? secureServer(
      {
        key: readFileSync(getKey(), 'utf8'),
        cert: readFileSync(getCert(), 'utf8'),
      },
      app
    )
  : unsecureServer(app)

const websockets = opennebulaWebsockets(appServer) || []

let config = {
  color: 'red',
  message: 'Server could not be started',
}

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
vmrc(appServer)
guacamole(appServer)

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
