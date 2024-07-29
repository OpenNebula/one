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
import { ObjectSchema, boolean, number, string } from 'yup'

import {
  BACKUP_INCREMENT_MODE_OPTIONS,
  BACKUP_MODE_OPTIONS,
  FS_FREEZE_OPTIONS,
  INPUT_TYPES,
  T,
} from 'client/constants'
import {
  Field,
  Section,
  arrayToOptions,
  disableFields,
  getObjectSchemaFromFields,
} from 'client/utils'

const BACKUP_VOLATILE_FIELD = {
  name: 'BACKUP_CONFIG.BACKUP_VOLATILE',
  label: T.BackupVolatileDisksQuestion,
  type: INPUT_TYPES.SWITCH,
  validation: boolean().yesOrNo().notRequired(),
  grid: { xs: 12, md: 6 },
}

const FS_FREEZE_FIELD = {
  name: 'BACKUP_CONFIG.FS_FREEZE',
  label: T.FSFreeze,
  tooltip: T.FSFreezeConcept,
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  values: arrayToOptions(Object.keys(FS_FREEZE_OPTIONS), {
    getText: (type) => type,
    getValue: (type) => FS_FREEZE_OPTIONS[type],
  }),
  validation: string()
    .trim()
    .default(() => undefined),
  grid: { xs: 12, md: 6 },
}

const KEEP_LAST_FIELD = {
  name: 'BACKUP_CONFIG.KEEP_LAST',
  label: T.HowManyBackupsQuestion,
  type: INPUT_TYPES.TEXT,
  htmlType: 'number',
  validation: number()
    .notRequired()
    .nullable(true)
    .default(() => undefined),
  grid: { xs: 12, md: 6 },
}

const MODE_FIELD = {
  name: 'BACKUP_CONFIG.MODE',
  label: T.Mode,
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  values: arrayToOptions(Object.keys(BACKUP_MODE_OPTIONS), {
    addEmpty: true,
    getText: (type) => type,
    getValue: (type) => BACKUP_MODE_OPTIONS[type],
  }),
  validation: string()
    .trim()
    .default(() => undefined),
  grid: { xs: 12, md: 6 },
}

const INCREMENT_MODE = {
  name: 'BACKUP_CONFIG.INCREMENT_MODE',
  label: T.IncrementMode,
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  dependOf: MODE_FIELD.name,
  htmlType: (mode) =>
    mode !== BACKUP_MODE_OPTIONS[T.Increment] && INPUT_TYPES.HIDDEN,
  values: arrayToOptions(Object.keys(BACKUP_INCREMENT_MODE_OPTIONS), {
    addEmpty: true,
    getText: (type) => type,
    getValue: (type) => BACKUP_INCREMENT_MODE_OPTIONS[type],
  }),
  validation: string()
    .trim()
    .default(() => undefined),
  grid: { xs: 12, md: 6 },
}

/** @type {Section[]} Sections */
export const SECTIONS = (oneConfig, adminGroup) => [
  {
    id: 'backup-configuration',
    fields: disableFields(
      [
        BACKUP_VOLATILE_FIELD,
        FS_FREEZE_FIELD,
        KEEP_LAST_FIELD,
        MODE_FIELD,
        INCREMENT_MODE,
      ],
      'BACKUP_CONFIG',
      oneConfig,
      adminGroup
    ),
  },
]

/** @type {Field[]} List of Placement fields */
export const FIELDS = [
  BACKUP_VOLATILE_FIELD,
  FS_FREEZE_FIELD,
  KEEP_LAST_FIELD,
  MODE_FIELD,
  INCREMENT_MODE,
]

/** @type {ObjectSchema} Graphics schema */
export const BACKUP_SCHEMA = getObjectSchemaFromFields(FIELDS)
