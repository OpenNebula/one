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
import { object, ObjectSchema, string } from 'yup'

import { DATASTORE_TYPES, INPUT_TYPES, T } from '@ConstantsModule'
import { datastoreTable } from '@ModelsModule'
import { Field, getValidationFromFields } from '@UtilsModule'

export const DATASTORE_FIELD = 'datastore'

const backupDatastoreTable = {
  columns: () =>
    datastoreTable
      .columns()
      .filter(({ id }) => !['owner', 'group', 'labels'].includes(id)),
  useData: () => {
    const result = datastoreTable.useData()

    return {
      ...result,
      data: []
        .concat(result?.data ?? [])
        .filter(
          (datastore) =>
            datastore?.TEMPLATE?.TYPE === DATASTORE_TYPES.BACKUP.value
        ),
    }
  },
}

/** @type {Field[]} Datastore fields */
export const FIELDS = [
  {
    name: DATASTORE_FIELD,
    label: T.SelectDatastores,
    type: INPUT_TYPES.TABLE,
    model: backupDatastoreTable,
    singleSelect: true,
    selectOnRowClick: true,
    fieldProps: {
      defaultPageSize: 5,
      preserveState: true,
      isEnableSearchBar: true,
      isEnableSort: true,
      isEnableFilters: true,
      isRowsSelectable: true,
    },
    validation: string()
      .trim()
      .required()
      .default(() => undefined),
    grid: { md: 12 },
  },
]

/** @type {ObjectSchema} Datastore schema */
export const SCHEMA = object(getValidationFromFields(FIELDS))
