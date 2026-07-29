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
import { boolean, object, string } from 'yup'

import { DATASTORE_TYPES, INPUT_TYPES, T } from '@ConstantsModule'
import { datastoreTable } from '@ModelsModule'
import { Field, getValidationFromFields } from '@UtilsModule'

const systemDatastoreTable = {
  columns: () =>
    datastoreTable
      .columns()
      .filter(({ id }) => !['owner', 'group', 'labels'].includes(id)),
  useData: () =>
    datastoreTable.useData(undefined, {
      selectFromResult: (result) => ({
        ...result,
        data: result?.data?.filter(
          (datastore) => +datastore?.TYPE === DATASTORE_TYPES.SYSTEM.id
        ),
      }),
    }),
}

/** @type {Field} Enforce field */
const ENFORCE = {
  name: 'enforce',
  label: T.EnforceCapacityChecks,
  tooltip: T.EnforceCapacityChecksConcept,
  type: INPUT_TYPES.SWITCH,
  validation: boolean().default(() => false),
  grid: { md: 12 },
}

/** @type {Field} Datastore field */
const DATASTORE = {
  name: 'datastore',
  label: T.SelectTheNewDatastore,
  type: INPUT_TYPES.TABLE,
  model: systemDatastoreTable,
  singleSelect: true,
  selectOnRowClick: true,
  getRowId: (row) => String(row?.ID),
  fieldProps: {
    defaultPageSize: 5,
    pageSizeOptions: [5, 10, 20],
    isEnableSearchBar: true,
    isEnableSort: true,
    isEnableFilters: true,
    isRowsSelectable: true,
    isMultiRowSelection: false,
    isCopyColumn: false,
    initialState: {
      filters: [{ id: 'type', value: DATASTORE_TYPES.SYSTEM.value }],
    },
  },
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined),
  grid: { md: 12 },
}

export const FIELDS = [ENFORCE, DATASTORE]

export const SCHEMA = object(getValidationFromFields(FIELDS))
