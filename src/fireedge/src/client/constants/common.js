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

/**
 * @typedef {'1'|'2'|'3'|'4'} LockLevel
 * - `USE` (1): locks Admin, Manage and Use actions.
 * - `MANAGE` (2): locks Manage and Use actions.
 * - `ADMIN` (3): locks only Admin actions.
 * - `ALL` (4): locks all actions.
 */

/**
 * @typedef {object} LockInfo
 * @property {'0'|'1'} LOCKED - If `1` is locked
 * @property {string|number} OWNER - Owner
 * @property {string|number} TIME - Time
 * @property {string|number} REQ_ID - Request id
 */

/**
 * @typedef {number|'-4'|'-3'|'-2'|'-1'} FilterFlag
 * - `-4`: Resources belonging to the user’s primary group
 * - `-3`: Resources belonging to the user
 * - `-2`: All resources
 * - `-1`: Resources belonging to the user and any of his groups
 * - `>= 0`: UID User’s Resources
 */

/** @typedef {'0'|'1'} Permission */

/**
 * @typedef {object} Permissions
 * @property {Permission} OWNER_U - Owner use
 * @property {Permission} OWNER_M - Owner manage
 * @property {Permission} OWNER_A - Owner administrator
 * @property {Permission} GROUP_U - Group use
 * @property {Permission} GROUP_M - Group manage
 * @property {Permission} GROUP_A - Group administrator
 * @property {Permission} OTHER_U - Other use
 * @property {Permission} OTHER_M - Other manage
 * @property {Permission} OTHER_A - Other administrator
 */

export const YES_VALUE = 'YES'
export const NO_VALUE = 'NO'
