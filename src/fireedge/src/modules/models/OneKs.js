/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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
import {
  ONEKS_STATE,
  STATE_SHOW_DATA,
  CAPACITY_USER_INPUTS,
} from '@ConstantsModule'

/**
 * @param {object} oneks - OneKS resource
 * @returns {object} State information from resource
 */
export const getVirtualOneKsState = (oneks) => {
  const { state: STATE } = oneks?.TEMPLATE?.CLUSTER_BODY ?? {}

  if (!ONEKS_STATE[STATE]) {
    return ONEKS_STATE.UNKNOWN
  }

  return ONEKS_STATE[STATE]
}

/**
 * @param {object} dataObj - Object with data
 * @returns {Array} Array with valid keys
 */
export const getValidKeys = (dataObj) => {
  if (!dataObj) return []

  return [...new Set(CAPACITY_USER_INPUTS)].filter(
    (key) => dataObj[key] !== undefined
  )
}

/**
 * @param {string} state - OneKs state
 * @returns {boolean} show data
 */
export const showDataByState = (state) =>
  Object.values(STATE_SHOW_DATA).includes(state)

/**
 * Get the state for a oneks control plane.
 *
 * @param {object} oneks - OneKS resource
 * @returns {object} State information from resource
 */
export const getVirtualOneKsStateControlPlane = (oneks) => {
  const { state: STATE } = oneks?.TEMPLATE?.CLUSTER_BODY?.control_plane ?? {}

  if (!ONEKS_STATE[STATE]) {
    return ONEKS_STATE.UNKNOWN
  }

  return ONEKS_STATE[STATE]
}

/**
 * Get the progress for a oneks.
 *
 * @param {string} state - OneKS state
 * @returns {number} Number between 0 and 100
 */
export const getOneKsProgress = (state) => {
  if (!state) return undefined

  switch (state) {
    case ONEKS_STATE.PENDING.name:
      return 0
    case ONEKS_STATE.BOOTSTRAPING.name:
      return 33
    case ONEKS_STATE.SCALING.name:
      return 33
    case ONEKS_STATE.UPGRADING.name:
      return 33
    case ONEKS_STATE.PROVISIONING.name:
      return 33
    case ONEKS_STATE.WARNING.name:
      return 33
    case ONEKS_STATE.DEPLOYING.name:
      return 33
    case ONEKS_STATE.PROVISIONING_MGMT.name:
      return 50
    case ONEKS_STATE.PROVISIONING_CP.name:
      return 66
    case ONEKS_STATE.DEPROVISIONING.name:
      return 66
    case ONEKS_STATE.PIVOTING_CLUSTER.name:
      return 66
    case ONEKS_STATE.RUNNING.name:
      return 100

    default:
      return undefined
  }
}

/**
 * Returns information about Node Group state.
 *
 * @param {number} state - Node Group state
 * @returns {object} - Node Group state object
 */
export const getNodeGroupState = (state) =>
  ONEKS_STATE?.[state] || ONEKS_STATE.UNKNOWN
