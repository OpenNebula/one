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
import {
  BACKUP_INCREMENT_MODE_OPTIONS,
  BACKUP_MODE_OPTIONS,
  EXECUTION_OPTIONS,
  FS_FREEZE_OPTIONS,
  INPUT_TYPES,
  T,
} from 'client/constants'
import { useSystemData } from 'client/features/Auth'

import { Field, arrayToOptions, getValidationFromFields } from 'client/utils'
import { ObjectSchema, boolean, number, object, string } from 'yup'

const NAME = {
  name: 'NAME',
  label: T.Name,
  type: INPUT_TYPES.TEXT,
  validation: string().trim().required(),
  grid: { xs: 12, md: 6 },
}

const PRIORITY = {
  name: 'PRIORITY',
  label: T.Priority,
  type: INPUT_TYPES.SLIDER,
  fieldProps: () => {
    const { adminGroup } = useSystemData()

    const defaultFieldProps = { min: 1, max: 50 }
    adminGroup && (defaultFieldProps.max = 100)

    return defaultFieldProps
  },
  grid: { xs: 12, md: 6 },
  validation: number()
    .positive()
    .required()
    .default(() => 1),
}

const EXECUTION = {
  name: 'EXECUTION',
  label: T.Execution,
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  values: arrayToOptions(Object.keys(EXECUTION_OPTIONS), {
    getText: (type) => type,
    getValue: (type) => EXECUTION_OPTIONS[type],
  }),
  validation: string().trim(),
  grid: { xs: 12, md: 6 },
}

const FS_FREEZE = {
  name: 'FS_FREEZE',
  label: T.FSFreeze,
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  values: arrayToOptions(Object.keys(FS_FREEZE_OPTIONS), {
    getText: (type) => type,
    getValue: (type) => FS_FREEZE_OPTIONS[type],
  }),
  validation: string().trim(),
  grid: { xs: 12, md: 6 },
}

const MODE = {
  name: 'MODE',
  label: T.Mode,
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  values: arrayToOptions(Object.keys(BACKUP_MODE_OPTIONS), {
    addEmpty: true,
    getText: (type) => type,
    getValue: (type) => BACKUP_MODE_OPTIONS[type],
  }),
  validation: string().trim(),
  grid: { xs: 12, md: 6 },
}

const INCREMENT_MODE = {
  name: 'INCREMENT_MODE',
  label: T.IncrementMode,
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  dependOf: MODE.name,
  htmlType: (mode) =>
    mode !== BACKUP_MODE_OPTIONS[T.Increment] && INPUT_TYPES.HIDDEN,
  values: arrayToOptions(Object.keys(BACKUP_INCREMENT_MODE_OPTIONS), {
    addEmpty: true,
    getText: (type) => type,
    getValue: (type) => BACKUP_INCREMENT_MODE_OPTIONS[type],
  }),
  validation: string().trim(),
  grid: { xs: 12, md: 6 },
}

const KEEP_LAST = {
  name: 'KEEP_LAST',
  label: T.KeepLast,
  type: INPUT_TYPES.TEXT,
  htmlType: 'number',
  fieldProps: { min: 1 },
  validation: number()
    .positive()
    .required()
    .default(() => 1),
}

/** @type {Field} Persistent field */
export const BACKUP_VOLATILE = {
  name: 'BACKUP_VOLATILE',
  label: T.BackupVolatile,
  type: INPUT_TYPES.SWITCH,
  validation: boolean().yesOrNo(),
  grid: { xs: 12, md: 6 },
}

/**
 * @returns {Field[]} Fields
 */
export const FIELDS = [
  NAME,
  PRIORITY,
  EXECUTION,
  FS_FREEZE,
  MODE,
  INCREMENT_MODE,
  KEEP_LAST,
  BACKUP_VOLATILE,
]

/**
 * @param {object} [stepProps] - Step props
 * @returns {ObjectSchema} Schema
 */
export const SCHEMA = object(getValidationFromFields(FIELDS))
