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

/**
 * @typedef BackupJob
 * @property {string|number} ID - Id
 * @property {string} NAME - Name
 * @property {object} TEMPLATE - Template information
 * @property {string} [TEMPLATE.DESCRIPTION] - BackupJob Description
 */

export const BACKUPJOB_ACTIONS = {
  CREATE_DIALOG: 'create_dialog',
  UPDATE_DIALOG: 'update_dialog',
  DELETE: 'delete',
  RENAME: ACTIONS.RENAME,
  CHANGE_OWNER: ACTIONS.CHANGE_OWNER,
  CHANGE_GROUP: ACTIONS.CHANGE_GROUP,
  PRIORITY: 'priority',
  LOCK: 'lock',
  UNLOCK: 'unlock',
  START: 'start',
  CANCEL: 'cancel',
}
