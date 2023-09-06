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
import { USER_STATES } from 'client/constants'

/**
 * Returns information about user's state.
 *
 * @param {object} user - User object
 * @param {boolean} user.ENABLED - User is enabled/disabled
 * @returns {USER_STATES.StateInfo} - User state object
 */
export const getState = ({ ENABLED = '0' } = {}) => USER_STATES[ENABLED]

/**
 * Computes quota usage details.
 *
 * @param {string} type - Quota type.
 * @param {object} quota - User quota details.
 * @returns {{
 * percentOfUsed: number,
 * percentLabel: string
 * }} - Quota used percentage and label.
 */
export const getQuotaUsage = (type, quota) => {
  let quotas = {}

  switch (type) {
    case 'DATASTORE':
      quotas = {
        images: computeQuotaUsageDetails(quota.IMAGES_USED, quota.IMAGES),
        size: computeQuotaUsageDetails(quota.SIZE_USED, quota.SIZE),
      }
      break
    case 'VM':
      quotas = {
        vms: computeQuotaUsageDetails(quota.VMS_USED, quota.VMS),
        runningVms: computeQuotaUsageDetails(
          quota.RUNNING_VMS_USED,
          quota.RUNNING_VMS
        ),
        memory: computeQuotaUsageDetails(quota.MEMORY_USED, quota.MEMORY),
        runningMemory: computeQuotaUsageDetails(
          quota.RUNNING_MEMORY_USED,
          quota.RUNNING_MEMORY
        ),
        cpu: computeQuotaUsageDetails(quota.CPU_USED, quota.CPU),
        runningCpu: computeQuotaUsageDetails(
          quota.RUNNING_CPU_USED,
          quota.RUNNING_CPU
        ),
        systemDiskSize: computeQuotaUsageDetails(
          quota.SYSTEM_DISK_SIZE_USED,
          quota.SYSTEM_DISK_SIZE
        ),
      }
      break
    case 'NETWORK':
      quotas = {
        leases: computeQuotaUsageDetails(quota.LEASES_USED, quota.LEASES),
      }
      break
    case 'IMAGE':
      quotas = {
        rvms: computeQuotaUsageDetails(quota.RVMS_USED, quota.RVMS),
      }
      break
    default:
      break
  }

  return quotas
}
const computeQuotaUsageDetails = (usedValue = '0', maxValue = '-1') => {
  if (maxValue === '-2') {
    return {
      percentOfUsed: 100,
      percentLabel: '∞/∞',
    }
  }

  const percentOfUsed = +maxValue > 0 ? (+usedValue * 100) / +maxValue : 0
  const percentLabel = `${usedValue}/${maxValue}`

  return { percentOfUsed, percentLabel }
}
