/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
const internalSunstonePath = `${appName}/${appNameSunstone}`
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
  defaultHeaderx509: ['x-client-dn'],
  defaultConfigErrorMessage: {
    color: 'red',
    message: 'file not found: %s',
  },
  defaultFilesWebsockets: {
    hooks: {
      path: `${baseUrl}${baseUrlWebsockets}hooks`,
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
  defaultCommandVM: 'onevm',
  defaultCommandMarketApp: 'onemarketapp',
  defaultHideCredentials: true,
  defaultHideCredentialReplacer: '****',
  defaultOneFlowServer: `${protocol}://${defaultIp}:2474`,
  defaultSunstonePath: internalSunstonePath,
  defaultLogsLevels: ['error', 'warm', 'info', 'http', 'verbose', 'debug'],
  defaultLogMessageLength: 100,
  defaultTypeLog: 'prod',
  defaultWebpackMode: 'development',
  defaultSensitiveDataForXMLRPC: [
    {
      regex: /^user\.allocate/,
      maskIndex: 1,
    },
  ],
  defaultProductionWebpackMode: 'production',
  defaultWebpackDevTool: 'inline-source-map',
  defaultLogPath: '/var/log/one',
  defaultSourceSystemPath: assetsClient,
  defaultSystemPath: `/usr/${assetsClient}`,
  defaultSharePath: '/usr/share/one',
  defaultVarPath: '/var/lib/one',
  defaultEtcPath: '/etc/one',
  defaultLabelsFilename: 'default-labels.yaml',
  defaultLogFilename: `${appName}.log`,
  defaultKeyFilename: `${appName}_key`,
  defaultSunstoneAuth: 'sunstone_auth',
  defaultBaseURL: '',
  endpointGuacamole: `${baseUrl}guacamole`,
  endpointExternalGuacamole: `${baseUrl}external-guacamole`,
  defaultNamespace: 'one',
  defaultMessageInvalidZone: 'Invalid Zone',
  default2FAIssuer: `${appName}-UI`,
  default2FAOpennebulaVar,
  default2FAOpennebulaTmpVar: `TMP_${default2FAOpennebulaVar}`,
  defaultMessageProblemOpennebula: 'Problem with connection or xml parser',
  defaultIP: defaultIp,
  defaultProtocol: protocol,
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

  /** REMOTE MODULES */
  defaultRemoteModules: [
    'UtilsModule',
    'ConstantsModule',
    'ContainersModule',
    'ComponentsModule',
    'FeaturesModule',
    'ProvidersModule',
    'ModelsModule',
    'HooksModule',
  ],

  /** CONFIGURATION FILE */
  defaultTabManifestFilename: 'tab-manifest.yaml',
  defaultRemoteModulesConfigFilename: 'remotes-config.yaml',
  defaultConfigFile: `${appName}-server.conf`,
  defaultSunstoneViews: `${appNameSunstone}-views.yaml`,
  defaultSunstoneConfig: `${appNameSunstone}-server.conf`,
  defaultApiTimeout: 45000,
  protectedConfigData: {
    [appNameSunstone]: [
      'support_url',
      'sunstone_prepend',
      'guacd',
      'tmpdir',
      'max_upload_file_size',
      'proxy',
      'token_remote_support',
    ],
  },

  /** HOOK OBJECT NAMES */
  hookObjectNames: {
    vn: 'net',
  },
  keysRDP: {
    hostname: { key: 'full address:s:', value: '' },
    username: { key: 'username:s:', value: '' },
    password: { key: 'password 51:b:', value: '' },
    port: { key: 'server port:i:', value: '' },
    'server-layout': { key: 'keyboard layout:i:', value: '' },
    'disable-audio': { key: 'audiomode:i:', value: 0 },
    'enable-audio-input': { key: 'redirectaudiocapture:1:', value: 0 },
    'enable-wallpaper': {
      key: 'disable wallpaper:i:',
      value: 0,
      reverse: true,
    },
    'enable-theming': { key: 'disable themes:i:', value: 0, reverse: true },
    'enable-font-smoothing': { key: 'allow font smoothing:i:', value: 1 },
    'enable-full-window-drag': {
      key: 'disable full window drag:i:',
      value: 0,
      reverse: true,
    },
    'enable-desktop-composition': {
      key: 'allow desktop composition:i:',
      value: 1,
    },
    'enable-menu-animations': {
      key: 'disable menu anims:i:',
      value: 0,
      reverse: true,
    },
    'disable-bitmap-caching': {
      key: 'bitmapcachepersistenable:i:',
      value: 0,
      reverse: true,
    },
    'disable-offscreen-caching': {
      key: 'offscreen caching:i:',
      value: 1,
      reverse: true,
    },
    'disable-glyph-caching': { key: 'glyphcache:i:', value: 0, reverse: true },
  },
  keysVNC: {
    hostname: { key: 'Host=', value: '' },
    port: { key: 'Port=', value: '' },
    username: { key: 'Username=', value: '' },
    password: { key: 'Password=', value: '' },
  },
}

module.exports = defaults
