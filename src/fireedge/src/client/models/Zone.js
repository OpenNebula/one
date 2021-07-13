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

import * as STATES from 'client/constants/states'
import COLOR from 'client/constants/color'

const ZONE_STATES = [
  { // 0
    name: STATES.ENABLED,
    color: COLOR.success.main
  },
  { // 1
    name: STATES.DISABLED,
    color: COLOR.debug.main
  }
]

/**
 * This function gets the zone state.
 *
 * @param {object} zone - Zone.
 * @param {number|string} zone.STATE - Zone state numeric code.
 * @returns {STATES.StateInfo} - Zone state information.
 */
export const getState = ({ STATE = 0 } = {}) => ZONE_STATES[+STATE]
