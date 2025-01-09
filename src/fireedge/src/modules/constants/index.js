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
import * as Setting from '@modules/constants/setting'

export const JWT_NAME = 'FireedgeToken'

export const BY = { text: 'by OpenNebula', url: 'https://opennebula.io/' }
export const SUPPORT_WEBSITE = 'https://opennebula.io/support/'
export const COMMUNITY_WEBSITE = 'https://opennebula.io/usec'
export const DOCUMENTATION_WEBSITE = 'https://docs.opennebula.io/6.3/'
export const AUTH_APPS = [
  { text: 'Authy', url: 'https://authy.com/download/' },
  {
    text: 'Google Authenticator',
    url: 'https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2&hl=en',
  },
  {
    text: 'Microsoft Authenticator',
    url: 'https://www.microsoft.com/en-us/p/microsoft-authenticator/9nblgggzmcj6?activetab=pivot:overviewtab',
  },
]

const isBackend = () => typeof window === 'undefined'

/**
 * Server side constants (not all of them are used in client)
 * Check `window.__PRELOADED_CONFIG__` in src/server/routes/entrypoints/App.js
 *
 * @type {object} - Server configuration
 */
export const SERVER_CONFIG = (() => {
  if (isBackend()) return {}

  const config = { ...(window.__PRELOADED_CONFIG__ ?? {}) }
  delete window.__PRELOADED_CONFIG__

  return config
})()

export const UNITS = {
  KB: 'KB',
  MB: 'MB',
  GB: 'GB',
  TB: 'TB',
  PB: 'PB',
  EB: 'EB',
  ZB: 'ZB',
  YB: 'YB',
}

// should be equal to the apps in src/server/utils/constants/defaults.js
export const _APPS = { sunstone: 'sunstone' }
export const APPS = Object.keys(_APPS)

export const APPS_IN_BETA = []
export const APPS_WITH_SWITCHER = [_APPS.sunstone]

export const APP_URL = '/fireedge'
export const WEBSOCKET_URL = `${APP_URL}/websockets`
export const STATIC_FILES_URL = `${APP_URL}/client/assets`
export const IMAGES_URL = `${STATIC_FILES_URL}/images`
export const LOGO_IMAGES_URL = `${IMAGES_URL}/logos`
export const PROVIDER_IMAGES_URL = `${IMAGES_URL}/providers`
export const PROVISION_IMAGES_URL = `${IMAGES_URL}/provisions`
export const DEFAULT_IMAGE = `${IMAGES_URL}/default.webp`
export const IMAGE_FORMATS = ['webp', 'png', 'jpg']

export const FONTS_URL = `${STATIC_FILES_URL}/fonts`

export const SCHEMES = Setting.SCHEMES
export const DEFAULT_SCHEME = Setting.SCHEMES.SYSTEM

export const CURRENCY = SERVER_CONFIG?.currency ?? 'EUR'
export const DEFAULT_LANGUAGE = SERVER_CONFIG?.default_lang ?? 'en'
export const LANGUAGES_URL = `${STATIC_FILES_URL}/languages`
export const VM_EXTENDED_POOL = !!(SERVER_CONFIG?.use_extended_vmpool ?? true)
export const LANGUAGES = SERVER_CONFIG.langs ?? {
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
  zh_TW: 'Chinese (Taiwan)',
}

export const ONEADMIN_ID = '0'
export const SERVERADMIN_ID = '1'
export const ONEADMIN_GROUP_ID = '0'

export const FILTER_POOL = {
  PRIMARY_GROUP_RESOURCES: '-4',
  USER_RESOURCES: '-3',
  ALL_RESOURCES: '-2',
  USER_GROUPS_RESOURCES: '-1',
}

/** @enum {string} Input types */
export const INPUT_TYPES = {
  AUTOCOMPLETE: 'autocomplete',
  CHECKBOX: 'checkbox',
  SWITCH: 'switch',
  FILE: 'file',
  TIME: 'time',
  HIDDEN: 'hidden',
  PASSWORD: 'password',
  SELECT: 'select',
  SLIDER: 'slider',
  TEXT: 'text',
  TABLE: 'table',
  TOGGLE: 'toggle',
  DOCKERFILE: 'dockerfile',
  UNITS: 'units',
  LABEL: 'label',
}

export const DEBUG_LEVEL = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
}

export const SOCKETS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  HOOKS: 'hooks',
  PROVISION: 'provision',
  GUACAMOLE: 'guacamole',
  EXTERNAL_GUACAMOLE: 'external-guacamole',
  VMRC: 'vmrc',
}

/** @enum {string} Names of resource */
export const RESOURCE_NAMES = {
  APP: 'marketplace-app',
  ACL: 'acl',
  BACKUP: 'backup',
  CLUSTER: 'cluster',
  DATASTORE: 'datastore',
  GROUP: 'group',
  HOST: 'host',
  IMAGE: 'image',
  FILE: 'file',
  LOGO: 'logo',
  MARKETPLACE: 'marketplace',
  SEC_GROUP: 'security-group',
  USER: 'user',
  VDC: 'virtual-data-center',
  VROUTER: 'vrouter',
  VROUTER_TEMPLATE: 'vrouter-template',
  VM_TEMPLATE: 'vm-template',
  VM_GROUP: 'vm-group',
  VM: 'vm',
  VN_TEMPLATE: 'network-template',
  VNET: 'virtual-network',
  SERVICE: 'service',
  SERVICE_TEMPLATE: 'service-template',
  ZONE: 'zone',
  BACKUPJOBS: 'backupjobs',
  SUPPORT: 'support',
}
export * as T from '@modules/constants/translates'

export * as ACTIONS from '@modules/constants/actions'
export * as STATES from '@modules/constants/states'
export * from '@modules/constants/acl'
export * from '@modules/constants/backupjob'
export * from '@modules/constants/cluster'
export * from '@modules/constants/color'
export * from '@modules/constants/common'
export * from '@modules/constants/datastore'
export * from '@modules/constants/errors'
export * from '@modules/constants/flow'
export * from '@modules/constants/group'
export * from '@modules/constants/guacamole'
export * from '@modules/constants/host'
export * from '@modules/constants/image'
export * from '@modules/constants/marketplace'
export * from '@modules/constants/marketplaceApp'
export * from '@modules/constants/network'
export * from '@modules/constants/networkTemplate'
export * from '@modules/constants/provision'
export * from '@modules/constants/quota'
export * from '@modules/constants/scheduler'
export * from '@modules/constants/securityGroup'
export * from '@modules/constants/serviceTemplate'
export * from '@modules/constants/support'
export * from '@modules/constants/system'
export * from '@modules/constants/user'
export * from '@modules/constants/userInput'
export * from '@modules/constants/vRouter'
export * from '@modules/constants/vRouterTemplate'
export * from '@modules/constants/vdc'
export * from '@modules/constants/vm'
export * from '@modules/constants/vmGroup'
export * from '@modules/constants/vmTemplate'
export * from '@modules/constants/zone'
