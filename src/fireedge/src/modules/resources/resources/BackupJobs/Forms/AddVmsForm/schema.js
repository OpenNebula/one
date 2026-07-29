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
import { ObjectSchema, array, object, string } from 'yup'

import { INPUT_TYPES, T } from '@ConstantsModule'
import { vmsTable } from '@ModelsModule'
import { Field, getValidationFromFields } from '@UtilsModule'

export const VMS_FIELD = 'VMS'
export const BACKUP_VMS_FIELD = 'BACKUP_VMS'

const selectionVmsTable = {
  ...vmsTable,
  columns: () =>
    vmsTable
      .columns()
      .filter(
        ({ id }) =>
          ![
            'owner',
            'group',
            'labels',
            'cpu',
            'memory',
            'ips',
            'disk_size',
          ].includes(id)
      ),
}

/** @type {Field} DataTable field */
const VMS = {
  name: VMS_FIELD,
  label: T.SelectVms,
  type: INPUT_TYPES.TABLE,
  model: selectionVmsTable,
  singleSelect: false,
  selectOnRowClick: true,
  fieldProps: {
    defaultPageSize: 5,
    preserveState: true,
    isEnableSearchBar: true,
    isEnableSort: true,
    isEnableFilters: true,
    isRowsSelectable: true,
  },
  validation: array(string().trim())
    .ensure()
    .min(1)
    .required()
    .default(() => []),
  grid: { md: 12 },
}

/** @type {Field} Order Backup Vms field */
export const BACKUP_VMS = {
  name: BACKUP_VMS_FIELD,
  label: T.VMsBackupJobOrder,
  type: INPUT_TYPES.TEXT,
  dependOf: [VMS_FIELD],
  watcher: ([vms = []] = [], { name, formContext } = {}) => {
    const value = formContext?.getValues?.(name) ?? ''
    const currentValue = typeof value === 'function' ? '' : value
    const selectedVms = []
      .concat(vms ?? [])
      .filter(Boolean)
      .map(String)
    const arrayValue = currentValue
      ? String(currentValue).split(',').filter(Boolean).map(String)
      : []
    let rtn = []

    rtn = arrayValue
    selectedVms.forEach((vm) => {
      if (!rtn.includes(vm)) {
        rtn.push(vm)
      }
    })
    const positionDelete = []
    rtn.forEach((vm, i) => {
      if (!selectedVms.includes(vm)) {
        positionDelete.push(i)
      }
    })
    positionDelete
      .sort((a, b) => b - a)
      .forEach((index) => {
        rtn.splice(index, 1)
      })

    return rtn.join(',')
  },
  multiline: true,
  validation: string().trim(),
  grid: { md: 12 },
}

/** @type {Field[]} List of fields */
export const FIELDS = [VMS, BACKUP_VMS]

/** @type {ObjectSchema} Schema */
export const SCHEMA = object(getValidationFromFields(FIELDS))
