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
import { INPUT_TYPES, T } from '@ConstantsModule'
import { vmdisksTable } from '@ModelsModule'
import { Field } from '@UtilsModule'
import { string, StringSchema } from 'yup'

import { STEP_ID as IMAGE_STEP_ID } from '@modules/resources/resources/Backups/Forms/RestoreForm/Steps/BackupsTable'

export const VM_DISK_FIELD = 'vmdisk'

const getVmDiskModel = (vmId) => ({
  ...vmdisksTable,
  useData: () =>
    vmdisksTable.useData(
      { id: vmId },
      { skip: vmId === undefined || vmId === null }
    ),
})

const getBackupDiskIds = (backupDiskIds = [], selectedImage = []) => {
  const backupImage = [].concat(selectedImage ?? []).filter(Boolean)?.[0]
  const imageDiskIds = backupImage?.BACKUP_DISK_IDS?.ID
  const appDiskIds = [].concat(backupDiskIds ?? []).filter(Boolean)
  const backupImageDiskIds = [].concat(imageDiskIds ?? []).filter(Boolean)

  return appDiskIds.length > 0 ? appDiskIds : backupImageDiskIds
}

/**
 * @param {object} [params] - Backup disk ids and VM id resource
 * @param {string[]} [params.backupDiskIds] - Backup disk ids
 * @param {string[]} [params.vmsId] - VM id
 * @returns {Field[]} VM disk fields
 */
export const FIELDS = ({ backupDiskIds = [], vmsId = [] } = {}) => [
  {
    name: VM_DISK_FIELD,
    label: T.SelectDisk,
    type: INPUT_TYPES.TABLE,
    dependOf: `$${IMAGE_STEP_ID}`,
    model: getVmDiskModel(vmsId?.[0]),
    singleSelect: true,
    selectOnRowClick: true,
    getRowId: (row) => String(row?.DISK_ID),
    fieldProps: {
      filter: (disks, selectedImage) => {
        const diskIds = getBackupDiskIds(backupDiskIds, selectedImage)
        const diskIdSet = new Set(diskIds.map(String))

        return []
          .concat(disks ?? [])
          .filter((disk) => diskIdSet.has(String(disk?.DISK_ID)))
      },
      defaultPageSize: 5,
      pageSizeOptions: [5, 10, 20],
      isEnableSearchBar: true,
      isEnableSort: true,
      isEnableFilters: true,
      isRowsSelectable: true,
      isMultiRowSelection: false,
      isCopyColumn: false,
    },
    validation: string()
      .trim()
      .notRequired()
      .nullable()
      .default(() => undefined),
    grid: { md: 12 },
  },
]

/** @type {StringSchema} VM Disks table schema */
export const SCHEMA = string()
  .trim()
  .notRequired()
  .nullable()
  .default(() => undefined)
