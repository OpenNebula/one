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
import { array, boolean, object, ObjectSchema, string } from 'yup'

import { BACKUP_SCHEMA } from '@modules/resources/resources/VmTemplate/Forms/CreateForm/Steps/ExtraConfiguration/backup/schema'
import {
  BACKUP_DISK_COLUMNS,
  getBackupDiskRows,
  normalizeBackupDiskIds,
  serializeBackupDiskIds,
} from '@ModelsModule'
import { getObjectSchemaFromFields } from '@UtilsModule'
import { INPUT_TYPES, T } from '@ConstantsModule'

export const INCLUDE_ALL_DISKS_FIELD = 'BACKUP_CONFIG._INCLUDE_ALL_VM_DISKS'
export const DISK_IDS_FIELD = 'BACKUP_CONFIG.DISK_IDS'
export const BACKUP_VOLATILE_FIELD = 'BACKUP_CONFIG.BACKUP_VOLATILE'

const isVolatileEnabled = (value) =>
  value === true || String(value).toUpperCase() === 'YES'

const getDiskModel = (vm, includeVolatile) => ({
  columns: () => BACKUP_DISK_COLUMNS,
  dataCy: 'backup-vm-disks',
  useData: () => ({
    data: getBackupDiskRows(vm, {
      includeVolatile: isVolatileEnabled(includeVolatile),
    }),
    isFetching: false,
  }),
})

/**
 * @param {object} vm - Virtual machine resource
 * @returns {object[]} Disk-selection form fields
 */
export const DISK_SELECTION_FIELDS = (vm) => [
  {
    name: INCLUDE_ALL_DISKS_FIELD,
    label: T.IncludeAllVmDisks,
    tooltip: T.IncludeAllVmDisksHint,
    type: INPUT_TYPES.SWITCH,
    validation: boolean().default(() => true),
    grid: { xs: 12, md: 6 },
  },
  {
    name: DISK_IDS_FIELD,
    label: T.SelectVmDisks,
    type: INPUT_TYPES.TABLE,
    dependOf: [INCLUDE_ALL_DISKS_FIELD, BACKUP_VOLATILE_FIELD],
    htmlType: ([includeAllDisks] = []) => includeAllDisks && INPUT_TYPES.HIDDEN,
    model: ([, includeVolatile] = []) => getDiskModel(vm, includeVolatile),
    singleSelect: false,
    selectOnRowClick: true,
    getRowId: (disk) => String(disk?.DISK_ID),
    fieldProps: {
      defaultPageSize: 5,
      pageSizeOptions: [5, 10, 20],
      preserveState: true,
      isCopyColumn: true,
      isEnableFilters: true,
      isEnableSearchBar: true,
      isEnableSort: true,
      isMultiRowSelection: true,
      isRowsSelectable: true,
    },
    validation: array(string().trim())
      .transform((_, originalValue) => normalizeBackupDiskIds(originalValue))
      .ensure()
      .when('_INCLUDE_ALL_VM_DISKS', {
        is: false,
        then: (schema) => schema.min(1).required(),
      })
      .default(() => [])
      .afterSubmit(serializeBackupDiskIds),
    grid: { xs: 12, md: 12 },
  },
]

/**
 * @param {object} props - Form properties
 * @param {object} props.vm - Virtual machine resource
 * @returns {ObjectSchema} Backup schema
 */
export const SCHEMA = ({ vm } = {}) =>
  object()
    .concat(BACKUP_SCHEMA)
    .concat(getObjectSchemaFromFields(DISK_SELECTION_FIELDS(vm)))
