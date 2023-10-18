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
import * as ACTIONS from 'client/constants/actions'
import * as STATES from 'client/constants/states'
import COLOR from 'client/constants/color'

/**
 * @typedef VMGROUP
 * @property {string|number} ID - Id
 * @property {string} NAME - Name
 * @property {object} TEMPLATE - Template information
 */

export const VMGROUP_STATES = [
  {
    name: STATES.ENABLED,
    shortName: 'on',
    color: COLOR.success.main,
  },
  {
    name: STATES.DISABLED,
    shortName: 'off',
    color: COLOR.error.dark,
  },
]

export const VMGROUP_ACTIONS = {
  CREATE_DIALOG: 'create_dialog',
  UPDATE_DIALOG: 'update_dialog',
  DELETE: 'delete',
  CHANGE_GROUP: ACTIONS.CHANGE_GROUP,
  CHANGE_OWNER: ACTIONS.CHANGE_OWNER,
  ENABLE: 'enable',
  DISABLE: 'disable',
  RENAME: ACTIONS.RENAME,
}
