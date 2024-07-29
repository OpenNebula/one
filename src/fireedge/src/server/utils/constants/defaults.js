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

const appName = 'fireedge'
const appNameSunstone = 'sunstone'
const appNameProvision = 'provision'
const internalSunstonePath = `${appName}/${appNameSunstone}`
const internalProvisionPath = `${appName}/${appNameProvision}`
const baseUrl = `${appName ? `/${appName}/` : '/'}`
const baseUrlWebsockets = 'websockets/'
const severityPrepend = 'severity_'
const assetsClient = '/lib/one/fireedge/dist/client'
const apps = {
  [appNameSunstone]: {
    theme: appNameSunstone,
    name: appNameSunstone,
    assets: true,
  },
  [appNameProvision]: {
    name: appNameProvision,
    theme: appNameProvision,
  },
}
const default2FAOpennebulaVar = 'TWO_FACTOR_AUTH_SECRET'
const defaultIp = 'localhost'
const protocol = 'http'
const defaults = {
  defaultTypeCrypto: 'aes-256-cbc',
  /**
   * Empty function.
   *
   * @returns {undefined} undefined data
   */
  defaultEmptyFunction: () => undefined,
  defaultTmpPath: '/tmp',
  defaultErrorTemplate: 'ERROR_FIREEDGE="%1$s"',
  defaultSessionExpiration: 180,
  defaultSessionLimitExpiration: 30,
  defaultRememberSessionExpiration: 43200,
  defaultRegexpStartJSON: /^{/,
  defaultRegexID: /^ID: (?<id>\d+)/,
  defaultRegexpEndJSON: /}$/,
  defaultRegexpSplitLine: /\r|\n/,
  defaultSizeRotate: '100k',
  defaultAppName: appName,
  defaultHeaderRemote: ['http_x_auth_username', 'x_auth_username'],
  defaultConfigErrorMessage: {
    color: 'red',
    message: 'file not found: %s',
  },
  defaultFilesWebsockets: {
    hooks: {
      path: `${baseUrl}${baseUrlWebsockets}hooks`,
      methods: ['GET', 'POST'],
    },
    [appNameProvision]: {
      path: `${baseUrl}${baseUrlWebsockets}${appNameProvision}`,
      methods: ['GET', 'POST'],
    },
    vcenter: {
      path: `${baseUrl}${baseUrlWebsockets}vcenter`,
      methods: ['GET', 'POST'],
    },
  },
  defaultApps: apps,
  httpMethod: {
    GET: 'GET',
    POST: 'POST',
    PUT: 'PUT',
    DELETE: 'DELETE',
  },
  defaultHash: {
    hash: 'sha256',
    digest: 'hex',
  },
  defaultFileStats: '-stats.json',
  from: {
    resource: 'RESOURCE',
    query: 'QUERY',
    postBody: 'POST_BODY',
  },
  defaultComunityRepo: 'https://downloads.opennebula.io/repo/',
  defaultDownloader: 'remotes/datastore/downloader.sh',
  defaultOpennebulaZones: [
    {
      id: '0',
      name: 'OpenNebula',
      rpc: `${protocol}://${defaultIp}:2633/RPC2`,
    },
  ],
  defaultConfigParseXML: {
    attributeNamePrefix: '',
    attrNodeName: '',
    ignoreAttributes: false,
    ignoreNameSpace: true,
    allowBooleanAttributes: false,
    parseNodeValue: false,
    parseAttributeValue: true,
    trimValues: true,
  },
  defaultCommandProvision: `one${appNameProvision}`,
  defaultCommandProvisionTemplate: `one${appNameProvision}-template`,
  defaultCommandProvider: 'oneprovider',
  defaultCommandVcenter: 'onevcenter',
  defaultCommandVM: 'onevm',
  defaultCommandMarketApp: 'onemarketapp',
  defaultFolderTmpProvision: 'tmp',
  defaultHideCredentials: true,
  defaultHideCredentialReplacer: '****',
  defaultOneFlowServer: `${protocol}://${defaultIp}:2474`,
  defaultSunstonePath: internalSunstonePath,
  defaultProvisionPath: internalProvisionPath,
  defaultProvidersConfigPath: 'providers.d',
  defaultLogsLevels: ['error', 'warm', 'info', 'http', 'verbose', 'debug'],
  defaultLogMessageLength: 100,
  defaultTypeLog: 'prod',
  defaultWebpackMode: 'development',
  defaultProductionWebpackMode: 'production',
  defaultWebpackDevTool: 'inline-source-map',
  defaultLogPath: '/var/log/one',
  defaultSourceSystemPath: assetsClient,
  defaultSystemPath: `/usr/${assetsClient}`,
  defaultSharePath: '/usr/share/one',
  defaultVarPath: '/var/lib/one',
  defaultEtcPath: '/etc/one',
  defaultLogFilename: `${appName}.log`,
  defaultKeyFilename: `${appName}_key`,
  defaultSunstoneAuth: 'sunstone_auth',
  defaultVmrcTokens: 'sunstone_vmrc_tokens/',
  defaultBaseURL: '',
  endpointVmrc: `${baseUrl}vmrc`,
  endpointGuacamole: `${baseUrl}guacamole`,
  defaultNamespace: 'one',
  defaultMessageInvalidZone: 'Invalid Zone',
  default2FAIssuer: `${appName}-UI`,
  default2FAOpennebulaVar,
  default2FAOpennebulaTmpVar: `TMP_${default2FAOpennebulaVar}`,
  defaultMessageProblemOpennebula: 'Problem with connection or xml parser',
  defaultIP: defaultIp,
  defaultSeverities: [
    `${severityPrepend}1`,
    `${severityPrepend}2`,
    `${severityPrepend}3`,
    `${severityPrepend}4`,
  ],
  defaultProtocolHotReload: 'http',
  defaultHost: '0.0.0.0',
  defaultPort: 2616,
  defaultEvents: ['SIGINT', 'SIGTERM'],

  /** CONFIGURATION FILE */
  defaultConfigFile: `${appName}-server.conf`,
  defaultSunstoneViews: `${appNameSunstone}-views.yaml`,
  defaultSunstoneConfig: `${appNameSunstone}-server.conf`,
  defaultProvisionConfig: `${appNameProvision}-server.conf`,
  defaultApiTimeout: 45000,
  protectedConfigData: {
    [appNameSunstone]: [
      'support_url',
      'vcenter_prepend_command',
      'sunstone_prepend',
      'guacd',
      'tmpdir',
      'max_upload_file_size',
      'proxy',
      'token_remote_support',
    ],
    [appNameProvision]: [
      'oneprovision_prepend_command',
      'oneprovision_optional_create_command',
    ],
  },

  /** HOOK OBJECT NAMES */
  hookObjectNames: {
    vn: 'net',
  },
}

module.exports = defaults
