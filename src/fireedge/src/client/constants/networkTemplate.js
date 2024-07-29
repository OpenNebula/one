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
// eslint-disable-next-line no-unused-vars
import { LockInfo, Permissions } from 'client/constants/common'

/**
 * @typedef VNetworkTemplate
 * @property {string} ID - Id
 * @property {string} NAME - Name
 * @property {string} UID - User id
 * @property {string} UNAME - User name
 * @property {string} GID - Group id
 * @property {string} GNAME - Group name
 * @property {string} REGTIME - Registration time
 * @property {Permissions} PERMISSIONS - Permissions
 * @property {LockInfo} [LOCK] - Lock information
 * @property {object} TEMPLATE - Template
 * @property {string} [TEMPLATE.VN_MAD] - Virtual network manager
 */

/** @enum {string} Virtual network template actions */
export const VN_TEMPLATE_ACTIONS = {
  CREATE_DIALOG: 'create_dialog',
  UPDATE_DIALOG: 'update_dialog',
  INSTANTIATE_DIALOG: 'instantiate_dialog',
  CHANGE_CLUSTER: 'change_cluster',
  LOCK: 'lock',
  UNLOCK: 'unlock',
  DELETE: 'delete',

  // INFORMATION
  RENAME: ACTIONS.RENAME,
  CHANGE_OWNER: ACTIONS.CHANGE_OWNER,
  CHANGE_GROUP: ACTIONS.CHANGE_GROUP,
}
