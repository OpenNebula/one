/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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
import * as Setting from 'client/constants/setting'
import { isBackend } from 'client/utils/environments'

export const JWT_NAME = 'FireedgeToken'

export const BY = { text: 'by OpenNebula', url: 'https://opennebula.io/' }

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
export const _APPS = { sunstone: 'sunstone', provision: 'provision' }
export const APPS = Object.keys(_APPS)

export const APPS_IN_BETA = []
export const APPS_WITH_SWITCHER = [_APPS.sunstone]
export const APPS_WITH_ONE_PREFIX = [_APPS.provision]

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
  VMRC: 'vmrc',
}

/** @enum {string} Names of resource */
export const RESOURCE_NAMES = {
  APP: 'marketplace-app',
  BACKUP: 'backup',
  CLUSTER: 'cluster',
  DATASTORE: 'datastore',
  GROUP: 'group',
  HOST: 'host',
  IMAGE: 'image',
  FILE: 'file',
  MARKETPLACE: 'marketplace',
  SEC_GROUP: 'security-group',
  USER: 'user',
  VDC: 'virtual-data-center',
  VROUTER: 'virtual-router',
  VM_TEMPLATE: 'vm-template',
  VM: 'vm',
  VN_TEMPLATE: 'network-template',
  VNET: 'virtual-network',
  SERVICE: 'service',
  SERVICE_TEMPLATE: 'service-template',
  ZONE: 'zone',
}

export * as T from 'client/constants/translates'
export * as ACTIONS from 'client/constants/actions'
export * as STATES from 'client/constants/states'
export * from 'client/constants/cluster'
export * from 'client/constants/common'
export * from 'client/constants/datastore'
export * from 'client/constants/flow'
export * from 'client/constants/group'
export * from 'client/constants/guacamole'
export * from 'client/constants/host'
export * from 'client/constants/image'
export * from 'client/constants/marketplace'
export * from 'client/constants/marketplaceApp'
export * from 'client/constants/network'
export * from 'client/constants/networkTemplate'
export * from 'client/constants/provision'
export * from 'client/constants/quota'
export * from 'client/constants/scheduler'
export * from 'client/constants/securityGroup'
export * from 'client/constants/user'
export * from 'client/constants/userInput'
export * from 'client/constants/vdc'
export * from 'client/constants/vm'
export * from 'client/constants/vmTemplate'
export * from 'client/constants/zone'
