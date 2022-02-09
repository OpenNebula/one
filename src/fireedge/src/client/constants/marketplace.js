/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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

/** @type {STATES.StateInfo[]} Marketplace states */
export const MARKETPLACE_STATES = [
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

/**
 * @enum {(
 * 'UNKNOWN'|
 * 'IMAGE'|
 * 'VM TEMPLATE'|
 * 'SERVICE TEMPLATE'
 * )} Marketplace app type
 */
export const MARKETPLACE_APP_TYPES = [
  'UNKNOWN',
  'IMAGE',
  'VM TEMPLATE',
  'SERVICE TEMPLATE',
]

/** @type {STATES.StateInfo[]} Marketplace app states */
export const MARKETPLACE_APP_STATES = [
  {
    // 0
    name: STATES.INIT,
    color: COLOR.info.main,
  },
  {
    // 1
    name: STATES.READY,
    color: COLOR.success.main,
  },
  {
    // 2
    name: STATES.LOCKED,
    color: COLOR.debug.main,
  },
  {
    // 3
    name: STATES.ERROR,
    color: COLOR.error.main,
  },
  {
    // 4
    name: STATES.DISABLED,
    color: COLOR.debug.light,
  },
]
