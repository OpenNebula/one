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

/**
 * @param {object} backup - Backup image resource
 * @returns {object[]} Backup increments normalized for restore forms
 */
export const getBackupIncrements = (backup = {}) =>
  []
    .concat(backup?.BACKUP_INCREMENTS?.INCREMENT ?? [])
    .filter(Boolean)
    .map((increment) => ({
      id: increment.ID,
      date: increment.DATE,
      source: increment.SOURCE,
      ...increment,
    }))

/**
 * @param {object} backup - Backup image resource
 * @returns {string[]} Backup disk IDs
 */
export const getBackupDiskIds = (backup = {}) =>
  [].concat(backup?.BACKUP_DISK_IDS?.ID ?? []).filter(Boolean)

/**
 * Normalizes the comma-separated or array representation used by backup
 * configuration disk IDs.
 *
 * @param {string|number|(string|number)[]} diskIds - Backup disk IDs
 * @returns {string[]} Normalized unique disk IDs
 */
export const normalizeBackupDiskIds = (diskIds) => [
  ...new Set(
    []
      .concat(diskIds ?? [])
      .flatMap((diskId) => String(diskId).split(','))
      .map((diskId) => diskId.trim())
      .filter(Boolean)
  ),
]

/**
 * Serializes backup disk IDs as expected by the OpenNebula template API.
 *
 * @param {string|number|(string|number)[]} diskIds - Backup disk IDs
 * @returns {string} Comma-separated disk IDs
 */
export const serializeBackupDiskIds = (diskIds) =>
  normalizeBackupDiskIds(diskIds).join(',')

/**
 * @param {object} backup - Backup image resource
 * @returns {string[]} VM IDs associated with the backup
 */
export const getBackupVmIds = (backup = {}) =>
  []
    .concat(backup?.VMS?.ID ?? [])
    .filter(Boolean)
    .map(String)

/**
 * @param {object} backup - Backup image resource
 * @returns {number} Number of VMs associated with the backup
 */
export const getBackupRunningVms = (backup = {}) =>
  backup?.RUNNING_VMS ?? getBackupVmIds(backup).length

/**
 * @param {object} formData - Restore backup form data
 * @returns {string} Restore options template
 */
export const getBackupRestoreOptions = (formData = {}) => {
  let options = `NO_IP="${formData.no_ip}"\nNO_NIC="${formData.no_nic}"\n`

  if (formData.name) {
    options += `NAME="${formData.name}"\n`
  }

  if (formData.restoreIndividualDisk === 'YES' && formData.individualDisk) {
    options += `DISK_ID="${formData.individualDisk}"\n`
  }

  if (formData.increment_id !== '' && formData.increment_id !== undefined) {
    options += `INCREMENT_ID="${formData.increment_id}"\n`
  }

  return options
}
