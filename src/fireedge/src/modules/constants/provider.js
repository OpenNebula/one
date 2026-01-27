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
import * as ACTIONS from '@modules/constants/actions'

/**
 * @typedef Provider
 * @property {string|number} ID - Id
 * @property {string} NAME - Name
 * @property {string|number} UID - User id
 * @property {string|number} GID - Group id
 * @property {string} UNAME - User name
 * @property {string} GNAME - Group name
 * @property {Permissions} PERMISSIONS - Permissions
 * @property {object} TEMPLATE - Template information
 * @property {string} [TEMPLATE.PROVIDER_BODY] - Provider body
 */

export const PROVIDER_ACTIONS = {
  CREATE_DIALOG: 'create_dialog',
  UPDATE_DIALOG: 'update_dialog',
  DELETE: 'delete',
  RENAME: ACTIONS.RENAME,
  CHANGE_OWNER: ACTIONS.CHANGE_OWNER,
  CHANGE_GROUP: ACTIONS.CHANGE_GROUP,
}
