import path from 'path'
import express from 'express'
import webpack from 'webpack'
import helmet from 'helmet'
import morgan from 'morgan'
import cors from 'cors'
import compression from 'compression'
import { env } from 'process'
import {
  accessSync,
  constants,
  createWriteStream,
  readFileSync
} from 'fs-extra'
import http from 'http'
import https from 'https'
import {
  defaultAppName,
  defaultTypeLog,
  defaultHost,
  defaultPort,
  defaultWebpackMode,
  defaultApps
} from './utils/constants/defaults'
import {
  validateServerIsSecure,
  getCert,
  getKey,
  genPathResources,
  genFireedgeKey
} from './utils/server'
import {
  entrypoint404,
  entrypointApi,
  entrypointApp
} from './routes/entrypoints'
import { websockets } from './routes/websockets'
import { vmrcUpgrade } from './routes/websockets/vmrc'
import { guacamole } from './routes/websockets/guacamole'
import { messageTerminal, getConfig } from './utils'

// set paths
genPathResources()

// set fireedge_key
genFireedgeKey()

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
const userLog = appConfig.log || 'dev'

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

let log = morgan('dev')
if (userLog === defaultTypeLog && global && global.FIREEDGE_LOG) {
  try {
    accessSync(global.FIREEDGE_LOG, constants.W_OK)
    const logStream = createWriteStream(global.FIREEDGE_LOG, {
      flags: 'a'
    })
    log = morgan('combined', { stream: logStream })
  } catch (err) {
    const config = {
      color: 'red',
      message: 'Error: %s',
      error: err.message || ''
    }
    messageTerminal(config)
  }
}

app.use(helmet.hidePoweredBy())
app.use(compression())
app.use(`${basename}/client`, express.static(path.resolve(__dirname, frontPath)))
app.use(`${basename}/client/*`, express.static(path.resolve(__dirname, frontPath)))
// log request
app.use(log)
// cors
if (appConfig.cors) {
  app.use(cors())
}
// post params parser body
app.use(express.urlencoded({ extended: false }))
app.use(express.json())

app.use(`${basename}/api`, entrypointApi) // opennebula Api routes
const frontApps = Object.keys(defaultApps)
frontApps.map(frontApp => {
  app.get(`${basename}/${frontApp}`, entrypointApp)
  app.get(`${basename}/${frontApp}/*`, entrypointApp)
})
app.get('/*', (req, res) => res.redirect(`/${defaultAppName}/provision`))
// 404 - public
app.get('*', entrypoint404)

const appServer = validateServerIsSecure()
  ? secureServer(
    {
      key: readFileSync(getKey(), 'utf8'),
      cert: readFileSync(getCert(), 'utf8')
    },
    app
  )
  : unsecureServer(app)

const sockets = websockets(appServer) || []

let config = {
  color: 'red',
  message: 'Server no start'
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
vmrcUpgrade(appServer)
guacamole(appServer)

function handleBreak (code) {
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
const eventProcess = ['SIGINT', 'SIGTERM']
eventProcess.forEach((nameEvent = '') => {
  if (nameEvent) {
    process.on(nameEvent, handleBreak)
  }
})
