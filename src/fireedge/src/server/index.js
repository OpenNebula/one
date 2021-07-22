/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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

import compression from 'compression'
import cors from 'cors'
import express from 'express'
import { readFileSync } from 'fs-extra'
import helmet from 'helmet'
import http from 'http'
import https from 'https'
import { resolve } from 'path'
import { env } from 'process'
import webpack from 'webpack'
import {
  entrypoint404,
  entrypointApi,
  entrypointApp
} from './routes/entrypoints'
import { websockets } from './routes/websockets'
import { guacamole } from './routes/websockets/guacamole'
import { vmrc } from './routes/websockets/vmrc'
import { getConfig, messageTerminal } from './utils'
import {
  defaultAppName, defaultApps,
  defaultEvents, defaultHost,
  defaultPort, defaultWebpackMode
} from './utils/constants/defaults'
import { getLoggerMiddleware, initLogger } from './utils/logger'
import {
  genFireedgeKey, genPathResources, getCert, getKey, validateServerIsSecure
} from './utils/server'

// set paths
genPathResources()

// set fireedge_key
genFireedgeKey()

// set logger
initLogger()

// destructure imports
const unsecureServer = http.createServer
const secureServer = https.createServer

const app = express()
const basename = defaultAppName ? `/${defaultAppName}` : ''

let frontPath = 'client'

// settings
const appConfig = getConfig()
const host = appConfig.host || defaultHost
const port = appConfig.port || defaultPort

if (env && env.NODE_ENV && env.NODE_ENV === defaultWebpackMode) {
  try {
    // eslint-disable-next-line import/no-extraneous-dependencies
    const webpackHotMiddleware = require('webpack-hot-middleware')
    // eslint-disable-next-line import/no-extraneous-dependencies
    const webpackDevMiddleware = require('webpack-dev-middleware')
    const webpackConfig = require('../../webpack.config.dev.client')
    const compiler = webpack(webpackConfig)
    app.use(webpackDevMiddleware(compiler, {
      serverSideRender: true,
      publicPath: webpackConfig.output.publicPath,
      stats: {
        assets: false,
        colors: true,
        version: false,
        hash: false,
        timings: false,
        chunks: false,
        chunkModules: false
      }
    })).use(webpackHotMiddleware(compiler))
  } catch (error) {
    if (error) {
      messageTerminal({
        color: 'red',
        error
      })
    }
  }
  frontPath = '../client'
}
app.use(helmet.hidePoweredBy())
app.use(compression())
app.use(`${basename}/client`, express.static(resolve(__dirname, frontPath)))
app.use(`${basename}/client/*`, express.static(resolve(__dirname, frontPath)))

const loggerMiddleware = getLoggerMiddleware()
if (loggerMiddleware) {
  app.use(loggerMiddleware)
}

// cors
if (appConfig.cors) {
  app.use(cors())
}
// post params parser body
app.use(express.urlencoded({ extended: false }))
app.use(express.json())

app.use(`${basename}/api`, entrypointApi) // opennebula Api routes
const frontApps = Object.keys(defaultApps)
frontApps.forEach(frontApp => {
  app.get(`${basename}/${frontApp}`, entrypointApp)
  app.get(`${basename}/${frontApp}/*`, entrypointApp)
})
app.get('/*', (req, res) => res.redirect(`/${defaultAppName}/provision`))
// 404 - public
app.get('*', entrypoint404)

const appServer = validateServerIsSecure()
  ? secureServer({ key: readFileSync(getKey(), 'utf8'), cert: readFileSync(getCert(), 'utf8') }, app)
  : unsecureServer(app)

const sockets = websockets(appServer) || []

let config = {
  color: 'red',
  message: 'Server could not be started'
}

appServer.listen(port, host, err => {
  if (!err) {
    config = {
      color: 'green',
      error: `${host}:${port}`,
      message: 'Server listen in %s'
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
  if (appServer && appServer.close && typeof appServer.close === 'function') {
    appServer.close(() => {
      // this close sockets
      sockets.forEach((socket) => {
        if (socket && socket.close && typeof socket.close === 'function') {
          socket.close()
        }
      })
      process.exit(0)
    })
  }
}
defaultEvents.forEach((nameEvent = '') => {
  if (nameEvent) {
    process.on(nameEvent, handleBreak)
  }
})
