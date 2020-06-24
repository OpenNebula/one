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

const fs = require('fs-extra');
const params = require('../config/params');
const { defaultTypeLog } = require('../config/defaults');
const functionRoutes = require('../config/function-routes');
const { validateAuth } = require('./jwt-functions');
const { messageTerminal } = require('./general-functions');
const { addWsServer } = require('./ws-zeromq');
const { getConfig } = require('./yml-connect');

// user config
const appConfig = getConfig();

const mode = appConfig.LOG || defaultTypeLog;

const {
  responseOpennebula,
  opennebulaConnect,
  getMethodForOpennebulaCommand,
  commandXML,
  getAllowedQueryParams,
  getRouteForOpennebulaCommand,
  checkOpennebulaCommand
} = require('./opennebula-functions');

const createParamsState = () => {
  const rtn = {};
  if (params && Array.isArray(params)) {
    params.map(param => {
      rtn[param] = null;
    });
  }
  return rtn;
};

const createQueriesState = () => {
  const rtn = {};
  const queries = getAllowedQueryParams();
  if (queries && Array.isArray(queries)) {
    queries.map(query => {
      rtn[query] = null;
    });
  }
  return rtn;
};

const includeMAPSJSbyHTML = (path = '') => {
  let scripts = '';
  if (mode === defaultTypeLog) {
    fs.readdirSync(path).map(file => {
      if (file.match(/\w*\.js\.map+$\b/gi)) {
        scripts += `<script src="/static/${file}" type="application/json"></script>`;
      }
    });
  }
  return scripts;
};

const includeJSbyHTML = (path = '') => {
  let scripts = '';
  fs.readdirSync(path).map(file => {
    if (file.match(/\w*\.js+$\b/gi)) {
      scripts += `<script src="/static/${file}"></script>`;
    }
  });
  return scripts;
};

const includeCSSbyHTML = (path = '') => {
  let scripts = '';
  fs.readdirSync(path).map(file => {
    if (file.match(/\w*\.css+$\b/gi)) {
      scripts += `<link rel="stylesheet" href="/static/${file}"></link>`;
    }
  });
  return scripts;
};

const validateRouteFunction = (routeFunction, httpMethod = '') => {
  let rtn;
  if (
    routeFunction &&
    routeFunction.httpMethod &&
    routeFunction.httpMethod === httpMethod &&
    routeFunction.action &&
    typeof routeFunction.action === 'function'
  ) {
    rtn = routeFunction.action;
  }
  return rtn;
};

const checkRouteFunction = route => {
  let rtn;
  const { private: functionPrivate, public: functionPublic } = functionRoutes;
  const functions = { ...functionPrivate, ...functionPublic };
  if (route in functions) {
    rtn = functions[route];
  }
  return rtn;
};

module.exports = {
  addWsServer,
  validateAuth,
  createParamsState,
  getAllowedQueryParams,
  createQueriesState,
  opennebulaConnect,
  includeMAPSJSbyHTML,
  includeJSbyHTML,
  includeCSSbyHTML,
  messageTerminal,
  getRouteForOpennebulaCommand,
  getMethodForOpennebulaCommand,
  commandXML,
  checkRouteFunction,
  checkOpennebulaCommand,
  validateRouteFunction,
  responseOpennebula
};
