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
 * @typedef vRouter
 * @property {string|number} ID - Id
 * @property {string} NAME - Name
 * @property {string|number} UID - User id
 * @property {string|number} GID - Group id
 * @property {string} UNAME - User name
 * @property {string} GNAME - Group name
 * @property {Permissions} PERMISSIONS - Permissions
 * @property {LockInfo} [LOCK] - Lock information
 * @property {string|number} REGTIME - Registration time
 * @property {object} TEMPLATE - Template information
 * @property {string} [TEMPLATE.CONTEXT] - Context
 */

/**
 * @typedef vRouterFeatures
 * @property {boolean} hide_cpu - If `true`, the CPU fields is hidden
 * @property {false|number} cpu_factor - Scales CPU by VCPU
 * - ``1``: Set it to 1 to tie CPU and vCPU
 * - ``{number}``: CPU = cpu_factor * VCPU
 * - ``{false}``: False to not scale the CPU
 */

export const VROUTER_ACTIONS = {
  CREATE_DIALOG: 'create_dialog',
  IMPORT_DIALOG: 'import_dialog',
  UPDATE_DIALOG: 'update_dialog',
  INSTANTIATE_DIALOG: 'instantiate_dialog',
  CREATE_APP_DIALOG: 'create_app_dialog',
  CLONE: 'clone',
  DELETE: 'delete',
  RECOVER: 'recover',
  LOCK: 'lock',
  UNLOCK: 'unlock',
  SHARE: 'share',
  UNSHARE: 'unshare',

  RENAME: ACTIONS.RENAME,
  CHANGE_OWNER: ACTIONS.CHANGE_OWNER,
  CHANGE_GROUP: ACTIONS.CHANGE_GROUP,
}
