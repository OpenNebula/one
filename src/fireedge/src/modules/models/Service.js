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
import { Service, SERVICE_STATES, STATES } from '@ConstantsModule'

/**
 * Returns information about Service state.
 *
 * @param {Service} service - Service
 * @returns {STATES.StateInfo} - Service state object
 */
export const getServiceState = ({ TEMPLATE = {} } = {}) =>
  SERVICE_STATES[TEMPLATE?.BODY?.state]

/**
 * Returns information about Service state.
 *
 * @param {number} state - Role state
 * @returns {STATES.StateInfo} - Service state object
 */
export const getRoleState = (state) => SERVICE_STATES?.[state]
