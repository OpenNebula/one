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

import { INPUT_TYPES, T } from '@ConstantsModule'
import { datastoreTable } from '@ModelsModule'
import { Field, getValidationFromFields } from '@UtilsModule'

export const DATASTORE_FIELD = 'datastore'

const selectionDatastoreTable = {
  ...datastoreTable,
  columns: () =>
    datastoreTable
      .columns()
      .filter(({ id }) => !['owner', 'group', 'labels'].includes(id)),
}

/** @type {Field[]} Datastore fields */
export const FIELDS = [
  {
    name: DATASTORE_FIELD,
    label: T.SelectDatastoreImage,
    type: INPUT_TYPES.TABLE,
    model: selectionDatastoreTable,
    singleSelect: true,
    selectOnRowClick: true,
    fieldProps: {
      filter: (DATA) => DATA.filter((ds) => ds.TYPE === '3'),
      defaultPageSize: 5,
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
