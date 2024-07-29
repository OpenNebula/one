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
import { INPUT_TYPES, T } from 'client/constants'
import { timeFromMilliseconds } from 'client/models/Helper'
import { Field, arrayToOptions, getValidationFromFields } from 'client/utils'
import { ObjectSchema, boolean, object, string } from 'yup'
import { STEP_ID as VM_DISK_ID } from 'client/components/Forms/Backup/RestoreForm/Steps/VmDisksTable'
import { STEP_ID as BACKUP_IMG_ID } from 'client/components/Forms/Backup/RestoreForm/Steps/BackupsTable'

const NO_NIC = {
  name: 'no_nic',
  label: T.DoNotRestoreNICAttributes,
  type: INPUT_TYPES.SWITCH,
  htmlType: (deps) => {
    const selectedImage = deps?.[BACKUP_IMG_ID]?.[0]

    return selectedImage ? INPUT_TYPES.HIDDEN : INPUT_TYPES.SWITCH
  },
  validation: boolean().yesOrNo(),
  grid: { md: 12 },
}

const NO_IP = {
  name: 'no_ip',
  label: T.DoNotRestoreIPAttributes,
  type: INPUT_TYPES.SWITCH,
  htmlType: (deps) => {
    const selectedImage = deps?.[BACKUP_IMG_ID]?.[0]

    return selectedImage ? INPUT_TYPES.HIDDEN : INPUT_TYPES.SWITCH
  },
  validation: boolean().yesOrNo(),
  grid: { md: 12 },
}

const INDIVIDUAL_DISK = {
  name: 'restoreIndividualDisk',
  label: T.RestoreIndividualDisk,
  type: INPUT_TYPES.SWITCH,
  validation: boolean().yesOrNo().default(false),
  stepControl: [
    {
      condition: (value) => value === false,
      steps: [VM_DISK_ID],
    },
  ],
  grid: { md: 12 },
}

const NAME = {
  name: 'name',
  label: T.Name,
  type: INPUT_TYPES.TEXT,
  validation: string(),
  grid: { md: 6 },
}

const INCREMENT_ID = ({ increments = [] }) => ({
  name: 'increment_id',
  label: T.IncrementId,
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  values: (deps) => {
    const selectedImage = deps?.[BACKUP_IMG_ID]?.[0]
    let backupIncrements = [].concat(
      selectedImage?.BACKUP_INCREMENTS?.INCREMENT ?? []
    )

    backupIncrements = backupIncrements.map((increment) => ({
      id: increment.ID,
      date: increment.DATE,
      source: increment.SOURCE,
    }))

    return arrayToOptions(
      backupIncrements?.length > 0 ? backupIncrements : increments,
      {
        addEmpty: true,
        getText: (increment) =>
          `${increment.id}: ${timeFromMilliseconds(increment.date)
            .toFormat('ff')
            .replace(',', '')} (${increment.source})`,
        getValue: (increment) => increment.id,
      }
    )
  },
  validation: string(),
  grid: { md: 6 },
  fieldProps: (deps) => ({
    disabled:
      deps?.[BACKUP_IMG_ID]?.[0]?.BACKUP_INCRMENETS?.INCREMENT?.length === 0 &&
      increments.length === 0,
  }),
})

/**
 * @param {object} [data] - Backup data
 * @returns {Field[]} Fields
 */
export const FIELDS = (data = {}) => [
  NAME,
  INCREMENT_ID(data),
  NO_NIC,
  NO_IP,
  INDIVIDUAL_DISK,
]

/**
 * @param {object} [data] - Backup data
 * @returns {ObjectSchema} Schema
 */
export const SCHEMA = (data) => object(getValidationFromFields(FIELDS(data)))
