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
// eslint-disable-next-line no-unused-vars
import { Permissions, LockInfo } from 'client/constants/common'
import * as ACTIONS from 'client/constants/actions'

/**
 * @typedef MarketplaceApp
 * @property {string|number} ID - Id
 * @property {string} NAME - Name
 * @property {string} DESCRIPTION - Description
 * @property {string} UID - User id
 * @property {string|number} GID - Group id
 * @property {string} GNAME - Group name
 * @property {string} UNAME - User name
 * @property {string} STATE - State
 * @property {Permissions} PERMISSIONS - Permissions
 * @property {string|number} TYPE - Type
 * @property {LockInfo} [LOCK] - Lock information
 * @property {string} MARKETPLACE_ID - Marketplace id
 * @property {string} MARKETPLACE - Marketplace name
 * @property {string} SIZE - Size
 * @property {string} REGTIME - Registration time
 * @property {string} ZONE_ID - Zone id
 * @property {string} ORIGIN_ID - Origin id
 * @property {string} SOURCE - Source
 * @property {string} MD5 - MD5
 * @property {string} VERSION - Version
 * @property {string} FORMAT - Format
 * @property {object} TEMPLATE - Template information
 * @property {string} [TEMPLATE.PUBLISHER] - Publisher
 * @property {string} [TEMPLATE.TAGS] - Tags
 * @property {string} [TEMPLATE.LINK] - Link
 * @property {string} APPTEMPLATE64 - App template in base64
 */

/** @enum {string} Marketplace App actions */
export const MARKETPLACE_APP_ACTIONS = {
  CREATE_DIALOG: 'create_dialog',
  EXPORT: 'export',
  DOWNLOAD: 'download',
  ENABLE: 'enable',
  DISABLE: 'disable',
  DELETE: 'delete',
  EDIT_LABELS: 'edit_labels',
  LOCK: 'lock',
  UNLOCK: 'unlock',

  // INFORMATION
  RENAME: ACTIONS.RENAME,
  CHANGE_OWNER: ACTIONS.CHANGE_OWNER,
  CHANGE_GROUP: ACTIONS.CHANGE_GROUP,
}
