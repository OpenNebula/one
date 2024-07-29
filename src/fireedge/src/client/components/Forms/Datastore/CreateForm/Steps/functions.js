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
import { DS_STORAGE_BACKENDS } from 'client/constants'

/**
 * @param {string} type - Datastore type
 * @returns {boolean} - True if type is shared
 */
function isShared(type) {
  return type === DS_STORAGE_BACKENDS.FS_SHARED.value
}

/**
 * @param {string} type - Datastore type
 * @returns {boolean} - True if type is ssh
 */
function isSsh(type) {
  return type === DS_STORAGE_BACKENDS.FS_SSH.value
}

/**
 * @param {string} type - Datastore type
 * @returns {boolean} - True if type is ceph
 */
function isCeph(type) {
  return type === DS_STORAGE_BACKENDS.CEPH.value
}

/**
 * @param {string} type - Datastore type
 * @returns {boolean} - True if type is lvm
 */
function isLvm(type) {
  return type === DS_STORAGE_BACKENDS.FS_LVM.value
}

/**
 * @param {string} type - Datastore type
 * @returns {boolean} - True if type is raw
 */
function isRaw(type) {
  return type === DS_STORAGE_BACKENDS.RAW.value
}

/**
 * @param {string} type - Datastore type
 * @returns {boolean} - True if type is restic
 */
function isRestic(type) {
  return type === DS_STORAGE_BACKENDS.RESTIC.value
}

/**
 * @param {string} type - Datastore type
 * @returns {boolean} - True if type is rsync
 */
function isRsync(type) {
  return type === DS_STORAGE_BACKENDS.RSYNC.value
}

/**
 * @param {string} type - Datastore type
 * @returns {boolean} - True if type is custom
 */
function isCustom(type) {
  return type === DS_STORAGE_BACKENDS.CUSTOM.value
}

/**
 * @param {string} type - Datastore type
 * @param {Function[]} evaulatedTypes - Functions to evaluate
 * @returns {boolean} - True if type is one of evaulatedTypes
 */
function typeIsOneOf(type, evaulatedTypes = []) {
  return evaulatedTypes.some((evaulatedType) => evaulatedType(type))
}

export {
  isShared,
  isSsh,
  isCeph,
  isLvm,
  isRaw,
  isRestic,
  isRsync,
  isCustom,
  typeIsOneOf,
}
