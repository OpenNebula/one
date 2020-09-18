/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
/*                                                                            */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may    */
/* not use this file except in compliance with the License. You may obtain    */
/* a copy of the License at                                                   */
/*                                                                            */
/* http://www.apache.org/licenses/LICENSE-2.0                                 */
/*                                                                            */
/* Unless required by applicable law or agreed to in writing, software        */
/* distributed under the License is distributed on an "AS IS" BASIS,          */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   */
/* See the License for the specific language governing permissions and        */
/* limitations under the License.                                             */
/* -------------------------------------------------------------------------- */

const compression = require('compression');
const { env } = require('process');
const helmet = require('helmet');
const express = require('express');
const morgan = require('morgan');
const path = require('path');
const cors = require('cors');
const {
  accessSync,
  constants: fsConstants,
  createWriteStream,
  readFileSync
} = require('fs-extra');
const { createServer: unsecureServer } = require('http');
const { createServer: secureServer } = require('https');
const bodyParser = require('body-parser');
const {
  defaultConfigLogPath,
  defaultConfigLogFile,
  defaultTypeLog,
  defaultPort
} = require('./utils/constants/defaults');
const { validateServerIsSecure, getCert, getKey } = require('./utils/server');
const {
  entrypoint404,
  entrypointApi,
  entrypointApp
} = require('./routes/entrypoints');
const { oneHooks } = require('./routes/websockets/zeromq');
const { vmrcUpgrade } = require('./routes/websockets/vmrc');
const { messageTerminal, getConfig } = require('./utils');

const app = express();

// settings
const appConfig = getConfig();
const port = appConfig.PORT || defaultPort;
const userLog = appConfig.LOG || 'dev';

let log = morgan('dev');
if (userLog === defaultTypeLog) {
  let logPath = `${defaultConfigLogPath}`;
  if (env && env.ONE_LOCATION) {
    logPath = env.ONE_LOCATION + logPath;
  }
  try {
    accessSync(logPath, fsConstants.W_OK);
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

app.use('/static', express.static(path.resolve(__dirname, 'public')));

// log request
app.use(log);

// cors
if (appConfig.CORS) {
  app.use(cors());
}

// post params parser body
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// routes
app.use('/api', entrypointApi); // opennebula Api routes
app.use('/', entrypointApp); // html for react app frontend

// 404 - public
app.get('*', entrypoint404);

// server certificates
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

appServer.listen(port, () => {
  const config = {
    color: 'green',
    type: port,
    message: 'Server listen in port %s'
  };
  messageTerminal(config);
});
vmrcUpgrade(appServer);
