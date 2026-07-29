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
import { ObjectSchema, object, string } from 'yup'

import { datastoreTable } from '@ModelsModule'
import { DATASTORE_TYPES, INPUT_TYPES, T } from '@ConstantsModule'
import { Field, getValidationFromFields } from '@UtilsModule'

export const DATASTORE_FIELD = 'DATASTORE_ID'

const imageDatastoreTable = {
  columns: () =>
    datastoreTable
      .columns()
      .filter(({ id }) => !['owner', 'group', 'labels'].includes(id)),
  useData: () =>
    datastoreTable.useData(undefined, {
      selectFromResult: (result) => ({
        ...result,
        data:
          result?.data?.filter(
            (datastore) => +datastore?.TYPE === DATASTORE_TYPES.IMAGE.id
          ) ?? [],
      }),
    }),
}

/** @type {Field} Datastore table field */
const DATASTORE = {
  name: DATASTORE_FIELD,
  label: T.SelectDatastore,
  type: INPUT_TYPES.TABLE,
  model: imageDatastoreTable,
  singleSelect: true,
  selectOnRowClick: true,
  fieldProps: {
    defaultPageSize: 5,
  },
  validation: string()
    .trim()
    .required()
    .default(() => undefined),
  grid: { md: 12 },
}

/** @type {Field[]} List of fields */
export const FIELDS = [DATASTORE]

/** @type {ObjectSchema} Schema */
export const SCHEMA = object(getValidationFromFields(FIELDS))
