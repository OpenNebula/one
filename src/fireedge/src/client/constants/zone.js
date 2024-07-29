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

/**
 * @typedef ZoneServer
 * @property {string} ID - Id
 * @property {string} NAME - Name
 * @property {string} ENDPOINT - RPC endpoint
 * @property {string} [STATE] - State
 * @property {string} [TERM] - Term
 * @property {string} [VOTEDFOR] - Voted for
 * @property {string} [COMMIT] - Commit
 * @property {string} [LOG_INDEX] - Log index
 * @property {string} [FEDLOG_INDEX] - Federation log index
 */

/**
 * @typedef Zone
 * @property {string} ID - Id
 * @property {string} NAME - Name
 * @property {0|1} STATE - Possible STATE values are 0 (ENABLED) and 1 (DISABLED)
 * @property {object} TEMPLATE - Template
 * @property {string} TEMPLATE.ENDPOINT - Endpoint
 * @property {{ SERVER: ZoneServer|ZoneServer[] }} SERVER_POOL - Server pool information
 */

/** @type {STATES.StateInfo[]} Zone states */
export const ZONE_STATES = [
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

/** @enum {string} Zone actions */
export const ZONE_ACTIONS = {
  CREATE_DIALOG: 'create_dialog',
  DELETE: 'delete',

  RENAME: ACTIONS.RENAME,
}
