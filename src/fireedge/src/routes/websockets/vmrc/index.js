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
const { createProxyMiddleware } = require('http-proxy-middleware');
const { readFileSync } = require('fs-extra');
const { getConfig } = require('../../../utils/yml');
const { messageTerminal } = require('../../../utils/general');
const { console } = require('window-or-global');

const appConfig = getConfig();
const vmrcData = appConfig.VMRC || {};

const endpoint = '/vmrc';
const url = vmrcData.TARGET || '';
const vmrcProxy = createProxyMiddleware(endpoint, {
  target: url,
  changeOrigin: false,
  ws: true,
  secure: /^(https):\/\/[^ "]+$/.test(url),
  logLevel: 'debug',
  pathRewrite: path => path.replace(endpoint, '/ticket'),
  router: req => {
    if (req && req.url) {
      const ticket = req.url.split('/')[2];
      try {
        const esxi = readFileSync(
          `${vmrcData.TOKENS_PATH || ''}/${ticket}`
        ).toString();
        return esxi;
      } catch (error) {
        const config = {
          color: 'red',
          type: error.message,
          message: 'Error read vmrc token: %s'
        };
        messageTerminal(config);
      }
    }
  }
});

const vmrc = appServer => {
  if (appServer) {
    appServer(endpoint, vmrcProxy);
  }
};
const vmrcUpgrade = appServer => {
  if (
    appServer &&
    appServer.on &&
    appServer.constructor &&
    appServer.constructor.name &&
    appServer.constructor.name === 'Server'
  ) {
    appServer.on('upgrade', vmrcProxy.upgrade);
  }
};

module.exports = {
  endpoint,
  vmrc,
  vmrcUpgrade
};
