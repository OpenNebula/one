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
import * as ACTIONS from 'client/constants/actions'
import * as STATES from 'client/constants/states'
import COLOR from 'client/constants/color'
// eslint-disable-next-line no-unused-vars
import { Permissions } from 'client/constants/common'

/**
 * @typedef Marketplace
 * @property {string} ID - Id
 * @property {string} NAME - Name
 * @property {string} UID - User id
 * @property {string} UNAME - User name
 * @property {string} GID - Group id
 * @property {string} GNAME - Group name
 * @property {0|1} STATE - Possible STATE values are 0 (ENABLE) and 1 (DISABLE)
 * @property {Permissions} PERMISSIONS - Permissions
 * @property {string} MARKET_MAD - Market manager
 * @property {string} ZONE_ID - Zone id
 * @property {string} TOTAL_MB - Total capacity
 * @property {string} FREE_MB - Free capacity
 * @property {string} USED_MB - Used capacity
 * @property {{ ID: string|string[] }} MARKETPLACEAPPS - Marketplace apps
 * @property {object} TEMPLATE - Template information
 * @property {string} [TEMPLATE.RESTRICTED_DIRS] - Restricted directory
 * @property {string} [TEMPLATE.SAFE_DIRS] - Safe directory
 * @property {string} [TEMPLATE.SHARED] - `YES` if it's shared
 * @property {string} [TEMPLATE.TYPE] - Type
 * @property {string} [TEMPLATE.TM_MAD] - TM manager
 */

/** @type {STATES.StateInfo[]} Marketplace states */
export const MARKETPLACE_STATES = [
  {
    // 0
    name: STATES.ENABLED,
    color: COLOR.success.main,
  },
  {
    // 1
    name: STATES.DISABLED,
    color: COLOR.debug.main,
  },
]

/**
 * @enum {(
 * 'UNKNOWN'|
 * 'IMAGE'|
 * 'VM TEMPLATE'|
 * 'SERVICE TEMPLATE'
 * )} Marketplace app type
 */
export const MARKETPLACE_APP_TYPES = [
  'UNKNOWN',
  'IMAGE',
  'VM TEMPLATE',
  'SERVICE TEMPLATE',
]

/** @type {STATES.StateInfo[]} Marketplace app states */
export const MARKETPLACE_APP_STATES = [
  {
    // 0
    name: STATES.INIT,
    color: COLOR.info.main,
  },
  {
    // 1
    name: STATES.READY,
    color: COLOR.success.main,
  },
  {
    // 2
    name: STATES.LOCKED,
    color: COLOR.debug.main,
  },
  {
    // 3
    name: STATES.ERROR,
    color: COLOR.error.main,
  },
  {
    // 4
    name: STATES.DISABLED,
    color: COLOR.debug.light,
  },
]

/** @enum {string} Datastore actions */
export const MARKETPLACE_ACTIONS = {
  CREATE_DIALOG: 'create_dialog',
  UPDATE_DIALOG: 'update_dialog',
  DELETE: 'delete',
  RENAME: ACTIONS.RENAME,
  CHANGE_OWNER: ACTIONS.CHANGE_OWNER,
  CHANGE_GROUP: ACTIONS.CHANGE_GROUP,
  ENABLE: 'enable',
  DISABLE: 'disable',
}

/**
 * @enum {{ high: number, low: number }}
 * Marketplace threshold to specify the maximum and minimum of the bar range
 */
export const MARKET_THRESHOLD = {
  CAPACITY: { high: 66, low: 33 },
}

export const MARKET_TYPES = {
  OPENNEBULA: {
    text: 'marketplace.types.one',
    value: 'one',
  },
  HTTP: {
    text: 'marketplace.types.http',
    value: 'http',
  },
  S3: {
    text: 'marketplace.types.s3',
    value: 's3',
  },
  LINUX_CONTAINERS: {
    text: 'marketplace.types.linuxcontainers',
    value: 'linuxcontainers',
  },
}
