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
import { COLOR } from '@modules/constants/color'
import { PROVISION_STATES } from '@modules/constants/cluster'

/**
 * Get the color for a provision state.
 *
 * @param {string} state - Provision state
 * @returns {string} Color for the state
 */
export const getProvisionColorState = (state) => {
  if (state) return PROVISION_STATES[state]?.color

  // Other cases, return info color
  return COLOR.info.light
}

/**
 * Get the progress for a provision.
 *
 * @param {string} state - Provision state
 * @returns {number} Number between 0 and 100
 */
export const getProvisionProgress = (state) => {
  if (!state) return undefined

  switch (state) {
    case PROVISION_STATES.PENDING.name:
      return 0
    case PROVISION_STATES.INIT.name:
      return 10
    case PROVISION_STATES.PLANNING.name:
      return 20
    case PROVISION_STATES.APPLYING.name:
      return 40
    case PROVISION_STATES.CONFIGURING_ONE.name:
      return 60
    case PROVISION_STATES.CONFIGURING_PROVISION.name:
      return 80
    case PROVISION_STATES.RUNNING.name:
      return 100
    default:
      return undefined
  }
}
