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

import { T } from '@ConstantsModule'
import { timeDiff, timeFromMilliseconds } from '@UtilsModule'

const HIDDEN_BACKUPJOB_TEMPLATE_REG = /^(SCHED_ACTION|ERROR)$/

const STATUS = {
  ERROR: { color: 'error', name: T.Error },
  ON_GOING: { color: 'info', name: T.OnGoing },
  NOT_STARTED: { color: 'warning', name: T.NotStartedYet },
  COMPLETED: { color: 'success', name: T.Completed },
}

/**
 * @param {object} value - OpenNebula ID map
 * @returns {boolean} true when the map has any value
 */
export const hasBackupJobValues = (value) =>
  Object.values(value ?? {}).length > 0

/**
 * @param {object} backupJob - Backup job resource
 * @returns {{color: string, name: string}} Backup job status
 */
export const getBackupJobStatus = (backupJob = {}) => {
  const { BACKING_UP_VMS, ERROR_VMS, LAST_BACKUP_TIME, OUTDATED_VMS } =
    backupJob ?? {}

  if (hasBackupJobValues(ERROR_VMS)) return STATUS.ERROR
  if (hasBackupJobValues(BACKING_UP_VMS)) return STATUS.ON_GOING

  if (!hasBackupJobValues(OUTDATED_VMS)) {
    return LAST_BACKUP_TIME === '0' ? STATUS.NOT_STARTED : STATUS.COMPLETED
  }

  return STATUS.COMPLETED
}

/**
 * @param {object} backupJob - Backup job resource
 * @returns {string} Backup job status name
 */
export const getBackupJobState = (backupJob = {}) =>
  getBackupJobStatus(backupJob)?.name

/**
 * @param {string|number} time - Last backup timestamp
 * @returns {string} Formatted timestamp
 */
export const getBackupJobLastBackupTime = (time) =>
  +time > 0 ? timeFromMilliseconds(+time).toFormat('ff') : '-'

/**
 * @param {string|number} time - Last backup timestamp
 * @returns {string} Relative timestamp
 */
export const getBackupJobRelativeLastBackupTime = (time) =>
  +time > 0 ? timeFromMilliseconds(+time).toRelative() : '-'

/**
 * Formats the duration reported by the API in seconds.
 *
 * @param {string|number} duration - Backup job duration in seconds
 * @returns {string} Formatted duration including its units
 */
export const getBackupJobLastBackupDuration = (duration) => {
  const seconds = Number(duration)

  return Number.isFinite(seconds) && seconds >= 0 ? timeDiff(0, seconds) : '-'
}

/**
 * @param {object} template - Backup job template
 * @returns {{key: string, value: *}[]} Visible template attributes
 */
export const getBackupJobVisibleAttributes = (template = {}) =>
  Object.entries(template)
    .filter(([key]) => !HIDDEN_BACKUPJOB_TEMPLATE_REG.test(key))
    .map(([key, value]) => ({
      key,
      value,
    }))

/**
 * @param {object} backupJob - Backup job resource
 * @param {string} [stateAttribute] - VM state attribute to filter by
 * @returns {string[]} VM IDs associated with the backup job
 */
export const getBackupJobVmIds = (backupJob = {}, stateAttribute) =>
  [
    stateAttribute
      ? backupJob?.[stateAttribute]?.ID ?? []
      : backupJob?.TEMPLATE?.BACKUP_VMS?.split?.(',') ?? [],
  ]
    .flat()
    .filter(Boolean)
    .map(String)
