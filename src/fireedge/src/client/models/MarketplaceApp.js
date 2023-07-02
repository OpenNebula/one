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
import {
  STATES,
  MARKETPLACE_APP_STATES,
  MARKETPLACE_APP_TYPES,
} from 'client/constants'

/**
 * Returns the name of marketplace app type.
 *
 * @param {object} marketplaceApp - Marketplace app
 * @param {number|string} marketplaceApp.TYPE - Type
 * @returns {MARKETPLACE_APP_TYPES} Marketplace app type name
 */
export const getType = ({ TYPE = 0 } = {}) => MARKETPLACE_APP_TYPES[+TYPE]

/**
 * Returns the marketplace app state information.
 *
 * @param {object} marketplaceApp - Marketplace app
 * @param {number|string} marketplaceApp.STATE - State
 * @returns {STATES.StateInfo} Marketplace app state information
 */
export const getState = ({ STATE = 0 } = {}) => MARKETPLACE_APP_STATES[+STATE]
