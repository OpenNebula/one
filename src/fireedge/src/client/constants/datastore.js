/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
import { DISK_TYPES_STR } from 'client/constants/image'
// eslint-disable-next-line no-unused-vars
import { Permissions } from 'client/constants/common'

/**
 * @typedef Datastore
 * @property {string|number} ID - Id
 * @property {string} NAME - Name
 * @property {string|number} UID - User id
 * @property {string} UNAME - User name
 * @property {string|number} GID - Group id
 * @property {string} GNAME - Group name
 * @property {0|1} STATE - Possible STATE values are 0 (READY) and 1 (DISABLE)
 * @property {Permissions} [PERMISSIONS] - Permissions
 * @property {string} DS_MAD - Datastore driver name
 * @property {string} TM_MAD - Transfer driver name
 * @property {string} BASE_PATH - Datastore directory
 * @property {DATASTORE_TYPES} TYPE - Type
 * @property {DISK_TYPES_STR} DISK_TYPE - Disk type
 * @property {{ ID: string[] }} CLUSTERS - Clusters
 * @property {{ ID: string[] }} IMAGES - Images
 * @property {string|number} TOTAL_MB - Total capacity
 * @property {string|number} FREE_MB - Free capacity
 * @property {string|number} USED_MB - Used capacity
 * @property {object} TEMPLATE - Template
 * @property {string} [TEMPLATE.RESTRICTED_DIRS] - Paths that cannot be used to register images. A space separated list of paths.
 * @property {string} [TEMPLATE.SAFE_DIRS] - If you need to allow a directory listed under RESTRICTED_DIRS. A space separated list of paths.
 * @property {string} [TEMPLATE.ALLOW_ORPHANS] - Safe directories
 * @property {string} [TEMPLATE.VCENTER_DC_NAME] - vCenter information
 * @property {string} [TEMPLATE.VCENTER_DC_REF] - vCenter information
 * @property {string} [TEMPLATE.VCENTER_DS_NAME] - vCenter information
 * @property {string} [TEMPLATE.VCENTER_DS_REF] - vCenter information
 * @property {string} [TEMPLATE.VCENTER_HOST] - vCenter information
 * @property {string} [TEMPLATE.VCENTER_INSTANCE_ID] - vCenter information
 */

/** @type {string[]} Datastore type information */
export const DATASTORE_TYPES = ['IMAGE', 'SYSTEM', 'FILE']

/** @type {STATES.StateInfo[]} Datastore states */
export const DATASTORE_STATES = [
  {
    name: STATES.READY,
    shortName: 'on',
    color: COLOR.success.main,
  },
  {
    name: STATES.DISABLED,
    shortName: 'off',
    color: COLOR.error.dark,
  },
]

/** @enum {string} Datastore actions */
export const DATASTORE_ACTIONS = {
  CREATE_DIALOG: 'create_dialog',
  DELETE: 'delete',

  // INFORMATION
  RENAME: ACTIONS.RENAME,
  CHANGE_MODE: ACTIONS.CHANGE_MODE,
  CHANGE_OWNER: ACTIONS.CHANGE_OWNER,
  CHANGE_GROUP: ACTIONS.CHANGE_GROUP,
}
