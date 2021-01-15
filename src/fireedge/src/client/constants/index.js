/* Copyright 2002-2020, OpenNebula Project, OpenNebula Systems                */
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

import { defaultApps, defaultAppName } from 'server/utils/constants/defaults'

export const JWT_NAME = 'FireedgeToken'
export const DEFAULT_LANGUAGE = 'en_US'

export const BY = {
  text: 'OpenNebula',
  url: 'https://opennebula.io/'
}

export const TIME_HIDE_LOGO = 1500
export const _APPS = defaultApps
export const APPS = Object.keys(defaultApps)
export const APP_URL = defaultAppName ? `/${defaultAppName}` : ''
export const WEBSOCKET_URL = `${APP_URL}/websocket`
export const STATIC_FILES_URL = `${APP_URL}/client/assets`

export const IMAGES_URL = `${STATIC_FILES_URL}/images`
export const PROVIDER_IMAGES_URL = `${IMAGES_URL}/providers`
export const PROVISION_IMAGES_URL = `${IMAGES_URL}/provisions`
export const DEFAULT_IMAGE = `${IMAGES_URL}/default.webp`

export const FONTS_URL = `${STATIC_FILES_URL}/fonts`
export const LANGUAGES_URL = `${STATIC_FILES_URL}/languages`

export const ONEADMIN_ID = '0'

export const REQUEST_ACTIONS = {
  INSTANTIATE: 'instantiate'
}

export const FILTER_POOL = {
  PRIMARY_GROUP_RESOURCES: '-4',
  USER_RESOURCES: '-3',
  ALL_RESOURCES: '-2',
  USER_GROUPS_RESOURCES: '-1'
}

export const INPUT_TYPES = {
  TEXT: 'text',
  HIDDEN: 'hidden',
  SELECT: 'select',
  CHECKBOX: 'checkbox',
  SLIDER: 'slider',
  AUTOCOMPLETE: 'autocomplete'
}

export * as T from 'client/constants/translates'
export * from 'client/constants/flow'
export * from 'client/constants/states'
export * from 'client/constants/provision'
