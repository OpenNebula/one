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
import { string, boolean, number, ObjectSchema } from 'yup'

import {
  Field,
  Section,
  arrayToOptions,
  getObjectSchemaFromFields,
  disableFields,
} from 'client/utils'
import {
  T,
  INPUT_TYPES,
  FS_FREEZE_OPTIONS,
  BACKUP_MODE_OPTIONS,
} from 'client/constants'

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
  type: INPUT_TYPES.SELECT,
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
    .default(() => undefined)
    .transform((_, val) => (val !== '' ? parseInt(val) : null)),
  grid: { xs: 12, md: 6 },
}

const MODE_FIELD = {
  name: 'BACKUP_CONFIG.MODE',
  label: T.Mode,
  type: INPUT_TYPES.SELECT,
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

/** @type {Section[]} Sections */
export const SECTIONS = (oneConfig, adminGroup) => [
  {
    id: 'backup-configuration',
    fields: disableFields(
      [BACKUP_VOLATILE_FIELD, FS_FREEZE_FIELD, KEEP_LAST_FIELD, MODE_FIELD],
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
]

/** @type {ObjectSchema} Graphics schema */
export const BACKUP_SCHEMA = getObjectSchemaFromFields(FIELDS)
