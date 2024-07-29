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
import { object, ObjectSchema, array, string } from 'yup'
import { Field, getValidationFromFields } from 'client/utils'
import { T, INPUT_TYPES, DATASTORE_TYPES } from 'client/constants'
import { DatastoresTable } from 'client/components/Tables'
import {
  COMMON_FIELDS,
  CEPH_FIELDS,
  RESTIC_FIELDS,
  RSYNC_FIELDS,
} from './Fields'
import { isCustom, typeIsOneOf } from '../functions'

const COMPATIBLE_SYSTEM_DATASTORES = {
  name: 'COMPATIBLE_SYSTEM_DATASTORES',
  label: T.CompatibleSystemDatastores,
  tooltip: T.CompatibleSystemDatastoresConcept,
  type: INPUT_TYPES.TABLE,
  Table: () => DatastoresTable,
  singleSelect: false,
  validation: array(string().trim())
    .notRequired()
    .default(() => undefined),
  fieldProps: {
    initialState: {
      filters: [{ id: 'TYPE', value: 'SYSTEM' }],
    },
  },
  dependOf: ['$general.TYPE', '$general.STORAGE_BACKEND'],
  htmlType: ([type, storageBackend] = []) =>
    (typeIsOneOf(storageBackend, [isCustom]) ||
      type !== DATASTORE_TYPES.IMAGE.value) &&
    INPUT_TYPES.HIDDEN,
  grid: { md: 12 },
}

/**
 * @returns {Field[]} Fields
 */
export const FIELDS = [
  ...COMMON_FIELDS,
  ...CEPH_FIELDS,
  ...RESTIC_FIELDS,
  ...RSYNC_FIELDS,
  COMPATIBLE_SYSTEM_DATASTORES,
]

/**
 * @param {object} [stepProps] - Step props
 * @returns {ObjectSchema} Schema
 */
export const SCHEMA = object(getValidationFromFields(FIELDS))
