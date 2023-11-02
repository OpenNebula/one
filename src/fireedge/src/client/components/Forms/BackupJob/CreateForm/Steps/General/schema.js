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
import {
  BACKUP_MODE_OPTIONS,
  FS_FREEZE_OPTIONS,
  INPUT_TYPES,
  T,
} from 'client/constants'

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
  type: INPUT_TYPES.TEXT,
  htmlType: 'number',
  validation: number()
    .positive()
    .required()
    .default(() => 1),
}

const FS_FREEZE = {
  name: 'FS_FREEZE',
  label: T.FSFreeze,
  type: INPUT_TYPES.SELECT,
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
  type: INPUT_TYPES.SELECT,
  values: arrayToOptions(Object.keys(BACKUP_MODE_OPTIONS), {
    addEmpty: true,
    getText: (type) => type,
    getValue: (type) => BACKUP_MODE_OPTIONS[type],
  }),
  validation: string().trim(),
  grid: { xs: 12, md: 6 },
}

const KEEP_LAST = {
  name: 'KEEP_LAST',
  label: T.KeepLast,
  type: INPUT_TYPES.TEXT,
  htmlType: 'number',
  validation: number()
    .positive()
    .required()
    .default(() => 1),
}

/** @type {Field} Persistent field */
export const BACKUP_VOLATILE = {
  name: 'BACKUP_VOLATILE',
  label: T.MakePersistent,
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
  FS_FREEZE,
  MODE,
  KEEP_LAST,
  BACKUP_VOLATILE,
]

/**
 * @param {object} [stepProps] - Step props
 * @returns {ObjectSchema} Schema
 */
export const SCHEMA = object(getValidationFromFields(FIELDS))
