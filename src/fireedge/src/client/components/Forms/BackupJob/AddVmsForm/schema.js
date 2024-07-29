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
import { ObjectSchema, array, object, string } from 'yup'

import { VmsTable } from 'client/components/Tables'
import { INPUT_TYPES, T } from 'client/constants'
import { Field, getValidationFromFields } from 'client/utils'

const VMS_NAME = 'VMS'
const BACKUP_VMS_NAME = 'BACKUP_VMS'

/** @type {Field} DataTable field */
const VMS = {
  name: VMS_NAME,
  type: INPUT_TYPES.TABLE,
  Table: () => VmsTable,
  singleSelect: false,
  displaySelectedRows: false,
  validation: array(string().trim())
    .required()
    .default(() => undefined),
  grid: { md: 12 },
  value: (values, form) => {
    const { VMS: vms } = values || {}
    if (vms && form?.setValue) {
      form?.setValue(VMS_NAME, vms)
    }
  },
}

/** @type {Field} Order Backup Vms field */
export const BACKUP_VMS = {
  name: BACKUP_VMS_NAME,
  label: T.VMsBackupJobOrder,
  type: INPUT_TYPES.TEXT,
  dependOf: [VMS_NAME],
  watcher:
    ([vms = []] = []) =>
    (value = '') => {
      const arrayValue = (value && value?.split(',')) || []
      let rtn = []

      rtn = arrayValue
      vms.forEach((vm) => {
        if (!rtn.includes(vm)) {
          rtn.push(vm)
        }
      })
      const positionDelete = []
      rtn.forEach((vm, i) => {
        if (!vms.includes(vm)) {
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
export const FIELDS = [BACKUP_VMS, VMS]

/** @type {ObjectSchema} Schema */
export const SCHEMA = object(getValidationFromFields(FIELDS))
