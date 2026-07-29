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
import { FormWithSchema } from '@ComponentsV2Module'
import {
  DATASTORE_FIELD,
  FIELDS,
  SCHEMA,
} from '@modules/resources/resources/VirtualMachine/Forms/BackupForm/Steps/DatastoresTable/schema'

import { Step } from '@UtilsModule'
import { T, VM_EXTENDED_POOL, VM_POOL_PAGINATION_SIZE } from '@ConstantsModule'

export const STEP_ID = 'datastore'
export { DATASTORE_FIELD }

const Content = () => (
  <FormWithSchema id={STEP_ID} cy={`${STEP_ID}`} fields={FIELDS} />
)

const findVm = (vmsData, vmId) =>
  Array.isArray(vmsData)
    ? vmsData.find((vmData) => String(vmData?.ID) === String(vmId))
    : undefined

const isIncrementalBackupVm = (vm = {}) => {
  const { BACKUPS } = vm
  const { LAST_INCREMENT_ID, MODE } = BACKUPS?.BACKUP_CONFIG || {}

  return LAST_INCREMENT_ID !== '-1' && MODE === 'INCREMENT'
}

const getTargetVms = (vmsData, selectedIds = [], app = {}) => {
  const selectedVmIds = []
    .concat(selectedIds ?? [])
    .filter((id) => id !== undefined && id !== null)
  const appVmIds = []
    .concat(app?.vmId ?? app?.vm?.ID ?? [])
    .filter((id) => id !== undefined && id !== null)

  const targetIds = selectedVmIds.length > 0 ? selectedVmIds : appVmIds
  const stateVms = targetIds.map((id) => findVm(vmsData, id)).filter(Boolean)

  if (stateVms.length > 0) return stateVms
  if (app?.vm?.ID !== undefined && app?.vm?.ID !== null) return [app.vm]

  return []
}

/**
 * Step to select the Datastore.
 *
 * @param {object} app - Marketplace App resource
 * @returns {Step} Datastore step
 */
const DatastoreStep = (app) => ({
  id: STEP_ID,
  label: T.SelectDatastoreImage,
  resolver: SCHEMA,
  defaultDisabled: {
    statePaths: [
      `oneApi.queries.getVmsPaginated({"extended":${
        VM_EXTENDED_POOL ? 1 : 0
      },"pageSize":${VM_POOL_PAGINATION_SIZE}}).data`,
      'general.selectedIds',
    ],
    condition: (vmsData, selectedIds) => {
      const targetVms = getTargetVms(vmsData, selectedIds, app)

      return targetVms.length > 0 && targetVms.every(isIncrementalBackupVm)
    },
  },
  content: Content,
})

export default DatastoreStep
