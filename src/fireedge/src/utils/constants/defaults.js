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

const default2FAOpennebulaVar = 'TWO_FACTOR_AUTH_SECRET';
const defaultIp = '127.0.0.1';
const protocol = 'http';
const defaults = {
  httpMethod: {
    GET: 'GET',
    POST: 'POST',
    PUT: 'PUT',
    DELETE: 'DELETE'
  },
  from: {
    resource: 'RESOURCE',
    query: 'QUERY',
    postBody: 'POST_BODY'
  },
  defaultOpennebulaZones: [
    {
      ID: 0,
      NAME: 'OpenNebula',
      RPC: `${protocol}://${defaultIp}:2633/RPC2`,
      VNC: ''
    }
  ],
  defaultOneFlowServer: {
    PROTOCOL: protocol,
    HOST: defaultIp,
    PORT: 2474
  },
  defaultConfigFile: `${__dirname}/../fireedge-server.conf`,
  defaultTypeLog: 'prod',
  defaultWebpackMode: 'development',
  defaultWebpackDevTool: 'inline-source-map',
  defaultConfigLogPath: '/var/log/one/',
  defaultConfigLogFile: 'fireedge.log',
  defaultBaseURL: '',
  defaultNamespace: 'one.',
  defaultMessageInvalidZone: 'Invalid Zone',
  default2FAIssuer: 'fireedge-UI',
  default2FAOpennebulaVar,
  default2FAOpennebulaTmpVar: `TMP_${default2FAOpennebulaVar}`,
  defaultGetMethod: 'info',
  defaultMessageProblemOpennebula: 'Problem with conection or xml parser',
  defaultMethodLogin: 'user.login',
  defaultMethodZones: 'zonepool.info',
  defaultMethodConfig: 'system.config',
  defaultMethodUserUpdate: 'user.update',
  defaultMethodUserInfo: 'user.info',
  defaultLang: 'en_US',
  defaultIP: defaultIp,
  defaultProtocolHotReload: 'http',
  defaultPort: 2616,
  defaultPortHotReload: '3001',
  translations: {
    en_US: 'English',
    ca: 'Catalan',
    cs_CZ: 'Czech',
    nl_NL: 'Dutch',
    da: 'Danish',
    fr_FR: 'French',
    de: 'German',
    it_IT: 'Italian',
    js: 'Japanese',
    lt_LT: 'Lithuanian',
    fa_IR: 'Persian',
    pl: 'Polish',
    pt_BR: 'Portiguese',
    pt_PT: 'Portuguese',
    tr_TR: 'Turkish',
    ru_RU: 'Russian',
    zh_CN: 'Simplified Chinese',
    sk_SK: 'Slovak',
    es_ES: 'Spanish'
  }
};

module.exports = defaults;
