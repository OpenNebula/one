import path from 'path';
import express from 'express';
import webpack from 'webpack';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import compression from 'compression';
import bodyParser from 'body-parser';
import { env } from 'process';
import {
  accessSync,
  constants,
  createWriteStream,
  readFileSync
} from 'fs-extra';
import http from 'http';
import https from 'https';
import {
  defaultConfigLogPath,
  defaultConfigLogFile,
  defaultTypeLog,
  defaultPort
} from './utils/constants/defaults';
import { validateServerIsSecure, getCert, getKey } from './utils/server';
import {
  entrypoint404,
  entrypointApi,
  entrypointApp
} from './routes/entrypoints';
import { oneHooks } from './routes/websockets/zeromq';
import { vmrcUpgrade } from './routes/websockets/vmrc';
import { guacamole } from './routes/websockets/guacamole';
import { messageTerminal, getConfig } from './utils';

// destructure imports
const unsecureServer = http.createServer;
const secureServer = https.createServer;

const app = express();

let frontPath = 'client';

// settings
const appConfig = getConfig();
const port = appConfig.PORT || defaultPort;
const userLog = appConfig.LOG || 'dev';

if (env.NODE_ENV === 'development') {
  // eslint-disable-next-line global-require
  const config = require('../../webpack.config.dev.client');
  const compiler = webpack(config);
  app.use(
    // eslint-disable-next-line global-require
    require('webpack-dev-middleware')(compiler, {
      noInfo: true,
      publicPath: config.output.publicPath,
      stats: {
        assets: false,
        colors: true,
        version: false,
        hash: false,
        timings: false,
        chunks: false,
        chunkModules: false
      }
    })
  );
  // eslint-disable-next-line import/no-extraneous-dependencies
  // eslint-disable-next-line global-require
  app.use(require('webpack-hot-middleware')(compiler));
  frontPath = '../client';
}
let log = morgan('dev');
if (userLog === defaultTypeLog) {
  let logPath = `${defaultConfigLogPath}`;
  if (env && env.ONE_LOCATION) {
    logPath = env.ONE_LOCATION + logPath;
  }
  try {
    accessSync(logPath, constants.W_OK);
    const logStream = createWriteStream(logPath + defaultConfigLogFile, {
      flags: 'a'
    });
    log = morgan('combined', { stream: logStream });
  } catch (err) {
    console.error('no access!');
  }
}
app.use(helmet.hidePoweredBy());
app.use(compression());
app.use('/client', express.static(path.resolve(__dirname, frontPath)));

// log request
app.use(log);
// cors
if (appConfig.CORS) {
  app.use(cors());
}
// post params parser body
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/api', entrypointApi); // opennebula Api routes
app.get('/*', entrypointApp);
// 404 - public
app.get('*', entrypoint404);

const appServer = validateServerIsSecure()
  ? secureServer(
      {
        key: readFileSync(getKey(), 'utf8'),
        cert: readFileSync(getCert(), 'utf8')
      },
      app
    )
  : unsecureServer(app);

oneHooks(appServer);

let config = {
  color: 'red',
  message: 'Server no start'
};

appServer.listen(port, '0.0.0.0', err => {
  if (!err) {
    config = {
      color: 'green',
      type: port,
      message: 'Server listen in port %s'
    };
  }
  messageTerminal(config);
});
vmrcUpgrade(appServer);
guacamole(appServer);
