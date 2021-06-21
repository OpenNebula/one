/* Copyright 2002-2021, OpenNebula Project, OpenNebula Systems                */
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

const appName = 'fireedge'
const prepend = `${appName ? `/${appName}/` : '/'}`
const apps = {
  flow: {
    name: 'flow',
    theme: 'flow',
    assets: true
  },
  provision: {
    name: 'provision',
    theme: 'provision'
  }
}
const default2FAOpennebulaVar = 'TWO_FACTOR_AUTH_SECRET'
const defaultIp = 'localhost'
const protocol = 'http'
const defaults = {
  defaultEmptyFunction: () => undefined,
  defaultErrorTemplate: 'ERROR_FIREEDGE="%1$s"',
  defaultOpennebulaExpiration: 180,
  defaultOpennebulaMinimumExpiration: 30,
  defaultAppName: appName,
  defaultConfigErrorMessage: {
    color: 'red',
    message: 'file not found: %s'
  },
  defaultFilesWebsockets: {
    hooks: {
      path: `${prepend}hooks`,
      methods: ['GET', 'POST']
    },
    provision: {
      path: `${prepend}provision`,
      methods: ['GET', 'POST']
    }
  },
  defaultFilesRoutes: [
    '2fa',
    'auth',
    'oneflow',
    'support',
    'vcenter',
    'zendesk',
    'provision'
  ],
  defaultApps: apps,
  httpMethod: {
    GET: 'GET',
    POST: 'POST',
    PUT: 'PUT',
    DELETE: 'DELETE'
  },
  defaultFileStats: '-stats.json',
  from: {
    resource: 'RESOURCE',
    query: 'QUERY',
    postBody: 'POST_BODY'
  },
  defaultOpennebulaZones: [
    {
      id: '0',
      name: 'OpenNebula',
      rpc: `${protocol}://${defaultIp}:2633/RPC2`,
      zeromq: `tcp://${defaultIp}:2101`
    }
  ],
  defaultCommandProvision: 'oneprovision',
  defaultCommandProvisionTemplate: 'oneprovision-template',
  defaultCommandProvider: 'oneprovider',
  defaultFolderTmpProvision: 'tmp',
  defaultHideCredentials: true,
  defaultHideCredentialReplacer: '****',
  defaultOneFlowServer: `${protocol}://${defaultIp}:2474`,
  defaultConfigFile: `${appName}-server.conf`,
  defaultTypeLog: 'prod',
  defaultWebpackMode: 'development',
  defaultProductionWebpackMode: 'production',
  defaultWebpackDevTool: 'inline-source-map',
  defaultLogPath: '/var/log/one',
  defaultSharePath: '/usr/share/one',
  defaultVarPath: '/var/lib/one',
  defaultEtcPath: '/etc/one',
  defaultLogFilename: `${appName}.log`,
  defaultKeyFilename: `${appName}_key`,
  defaultVmrcTokens: 'sunstone_vmrc_tokens/',
  defaultBaseURL: '',
  endpointVmrc: `${prepend}vmrc`,
  endpointGuacamole: `${prepend}guacamole`,
  defaultNamespace: 'one.',
  defaultMessageInvalidZone: 'Invalid Zone',
  default2FAIssuer: `${appName}-UI`,
  default2FAOpennebulaVar,
  default2FAOpennebulaTmpVar: `TMP_${default2FAOpennebulaVar}`,
  defaultGetMethod: 'info',
  defaultMessageProblemOpennebula: 'Problem with connection or xml parser',
  defaultMethodLogin: 'user.login',
  defaultMethodZones: 'zonepool.info',
  defaultMethodConfig: 'system.config',
  defaultMethodUserUpdate: 'user.update',
  defaultMethodUserInfo: 'user.info',
  defaultIP: defaultIp,
  defaultProtocolHotReload: 'http',
  defaultHost: '0.0.0.0',
  defaultPort: 2616,
  availableLanguages: {
    bg_BG: 'Bulgarian (Bulgaria)',
    bg: 'Bulgarian',
    ca: 'Catalan',
    cs_CZ: 'Czech',
    da: 'Danish',
    de_CH: 'German (Switzerland)',
    de: 'German',
    el_GR: 'Greek (Greece)',
    en: 'English',
    es_ES: 'Spanish',
    et_EE: 'Estonian',
    fa_IR: 'Persian (Iran)',
    fa: 'Persian',
    fr_CA: 'French (Canada)',
    fr_FR: 'French',
    hu_HU: 'Hungary',
    it_IT: 'Italian',
    ja: 'Japanese',
    ka: 'Georgian',
    lt_LT: 'Lithuanian',
    nl_NL: 'Dutch',
    pl: 'Polish',
    pt_PT: 'Portuguese',
    ro_RO: 'Romanian',
    ru_RU: 'Russian',
    ru: 'Russian',
    si: 'Sinhala',
    sk_SK: 'Slavak',
    sr_RS: 'Serbian',
    sv: 'Swedish',
    th_TH: 'Thai (Thailand)',
    th: 'Thai',
    tr_TR: 'Turkish (Turkey)',
    tr: 'Turkish',
    uk_UA: 'Ukrainian (Ukraine)',
    uk: 'Ukrainian',
    vi: 'Vietnamese',
    zh_CN: 'Chinese (China)',
    zh_TW: 'Chinese (Taiwan)'
  }
}

module.exports = defaults
